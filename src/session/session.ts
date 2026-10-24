import { chooseInstrument, type InstrumentInfo } from '../audio/instruments';
import { findStage, type Curriculum, type Stage, type Strand } from '../core/curriculum';
import { chooseItem, newItems } from '../core/item-selection';
import { noteName } from '../core/pitch';
import { recordAnswer, type Progress } from '../core/progress';
import type { Rng } from '../core/rng';
import { isCurriculumComplete } from '../core/scheduler';
import { stageTarget } from '../core/scoring';
import type { Script } from '../core/script';
import type { ExerciseRegistry } from '../exercises/registry';
import type { ExerciseType, Question } from '../exercises/types';
import type { Settings } from '../storage/progress-store';
import { ActiveTimer } from './active-timer';
import type { AudioPort, Clock, LogPort, PlayHandle, VisibilitySource } from './ports';

export type Phase =
  'idle' | 'intro' | 'playing' | 'awaiting' | 'confirming' | 'feedback' | 'levelup' | 'ended';

export interface SessionSummary {
  level: number;
  points: number;
  target: number;
  levelsGained: number;
}

/** Everything the UI needs to render the session. */
export interface SessionView {
  phase: Phase;
  level: number;
  points: number;
  target: number;
  /** Answer choices for the current stage, in display order. */
  options: string[];
  /** Label currently shown in sync with intro/feedback audio. */
  label: string | null;
  feedback: { given: string; correct: string; continueEnabled: boolean } | null;
  /** Result of the most recent answer, for a brief visual confirmation. */
  lastCorrect: boolean | null;
  /** New level, while the level-up announcement shows. */
  levelUp: number | null;
  summary: SessionSummary | null;
  remainingSec: number;
  curriculumComplete: boolean;
}

export interface SessionDeps {
  curriculum: Curriculum;
  registry: ExerciseRegistry;
  audio: AudioPort;
  log: LogPort;
  clock: Clock;
  visibility: VisibilitySource;
  rng: Rng;
  instruments: InstrumentInfo[];
  settings: Settings;
  save(progress: Progress): Promise<void>;
  sleep(ms: number): Promise<void>;
  onChange(view: SessionView): void;
}

const LEVEL_UP_MS = 1500;

interface Current {
  strand: Strand;
  stage: Stage;
  exercise: ExerciseType;
  question: Question;
  instrument: string;
  enabledAt: number | null;
  replays: number;
  answer: string | null;
}

/**
 * One practice session: a time-boxed loop of questions on the learner's current stage(s).
 * Progress is saved after every answer; audio interrupted by the app going to the background
 * is replayed from the start of the interrupted part when the app returns.
 */
export class Session {
  private progressState: Progress;
  private phase: Phase = 'idle';
  private timer: ActiveTimer | null = null;
  private current: Current | null = null;
  private handle: PlayHandle | null = null;
  /** Incremented to invalidate in-flight playback when stopped or interrupted. */
  private generation = 0;
  private interruptedPhase: Phase | null = null;
  private unsubscribeVisibility: (() => void) | null = null;
  private label: string | null = null;
  private lastCorrect: boolean | null = null;
  private levelUp: number | null = null;
  private continueEnabled = false;
  private summary: SessionSummary | null = null;
  private startLevel = 0;
  private questions = 0;
  /** Set when the last answer cleared the stage, until the level-up has been announced. */
  private pendingClear = false;

  constructor(
    private readonly deps: SessionDeps,
    progress: Progress,
  ) {
    this.progressState = progress;
    this.startLevel = progress.level;
  }

  get progress(): Progress {
    return this.progressState;
  }

  view(): SessionView {
    const { stage, exercise } = this.stageInfo();
    const c = this.current;
    return {
      phase: this.phase,
      level: this.progressState.level,
      points: this.progressState.points,
      target: stageTarget(stage, this.deps.curriculum.scoring),
      options: exercise.answerOptions(stage),
      label: this.label,
      feedback:
        this.phase === 'feedback' && c?.answer
          ? { given: c.answer, correct: c.question.item, continueEnabled: this.continueEnabled }
          : null,
      lastCorrect: this.lastCorrect,
      levelUp: this.levelUp,
      summary: this.summary,
      remainingSec: Math.max(0, Math.ceil((this.sessionMs() - this.elapsedMs()) / 1000)),
      curriculumComplete: isCurriculumComplete(
        this.deps.curriculum,
        new Set(this.progressState.clearedStageIds),
      ),
    };
  }

  async start(): Promise<void> {
    if (this.phase !== 'idle') return;
    await this.deps.audio.unlock();
    this.timer = new ActiveTimer(this.deps.clock, this.deps.visibility);
    this.unsubscribeVisibility = this.deps.visibility.subscribe((v) => this.onVisibility(v));
    const p = this.progressState;
    await this.deps.log.record({
      type: 'session_start',
      level: p.level,
      stageId: p.currentStageId,
      sessionMinutes: this.deps.settings.sessionMinutes,
    });
    await this.logStageStart();
    await this.nextQuestion();
  }

  /** Answer the current question; ignored unless answers are being accepted. */
  async answer(answer: string): Promise<void> {
    const c = this.current;
    if (this.phase !== 'awaiting' || !c) return;
    c.answer = answer;
    const correct = answer === c.question.item;
    const before = this.progressState;
    const outcome = recordAnswer(before, this.deps.curriculum, c.question.item, correct);
    this.progressState = outcome.progress;
    this.questions++;
    this.lastCorrect = correct;
    await this.persist();
    await this.deps.log.record({
      type: 'answer',
      strandId: c.strand.id,
      stageId: c.stage.id,
      level: before.level,
      exercise: c.exercise.name,
      item: c.question.item,
      answer,
      correct,
      responseMs: Math.round(this.deps.clock.now() - (c.enabledAt ?? this.deps.clock.now())),
      replays: c.replays,
      rootMidi: c.question.root,
      root: noteName(c.question.root),
      direction: c.question.direction ?? null,
      register: c.question.register,
      instrument: c.instrument,
      pointsBefore: outcome.pointsBefore,
      pointsAfter: outcome.pointsAfter,
    });
    if (outcome.cleared) {
      await this.deps.log.record({
        type: 'stage_cleared',
        strandId: c.strand.id,
        stageId: c.stage.id,
        level: outcome.progress.level,
        questions: outcome.stageQuestions,
      });
    }
    this.pendingClear = outcome.cleared;
    if (correct) {
      this.setPhase('confirming');
      const finished = await this.play(c.exercise.confirmScript(c.question));
      if (finished) await this.afterAnswer();
    } else {
      await this.playCorrection();
    }
  }

  /** Replays the question before answering, at no cost. */
  async replay(): Promise<void> {
    const c = this.current;
    if (this.phase !== 'awaiting' || !c) return;
    c.replays++;
    await this.playQuestion();
  }

  /** Plays the corrective feedback again (after it has finished). */
  async hearAgain(): Promise<void> {
    if (this.phase !== 'feedback' || !this.continueEnabled) return;
    await this.playCorrection();
  }

  /** Moves on after feedback; only available once the correct answer has been heard. */
  async continue(): Promise<void> {
    if (this.phase !== 'feedback' || !this.continueEnabled) return;
    await this.afterAnswer();
  }

  /** Ends the session now; everything up to the last answer is already saved. */
  async endEarly(): Promise<void> {
    if (this.phase === 'ended' || this.phase === 'idle') return;
    await this.end('early');
  }

  // --- internals ---

  private stageInfo(): { strand: Strand; stage: Stage; exercise: ExerciseType } {
    const found = findStage(this.deps.curriculum, this.progressState.currentStageId);
    if (!found) throw new Error(`unknown stage ${this.progressState.currentStageId}`);
    return {
      strand: found.strand,
      stage: found.stage,
      exercise: this.deps.registry.get(found.strand.exercise),
    };
  }

  private sessionMs(): number {
    return this.deps.settings.sessionMinutes * 60_000;
  }

  private elapsedMs(): number {
    return this.timer?.elapsedMs() ?? 0;
  }

  private timeUp(): boolean {
    return this.elapsedMs() >= this.sessionMs();
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.emit();
  }

  private emit(): void {
    this.deps.onChange(this.view());
  }

  private async persist(): Promise<void> {
    try {
      await this.deps.save(this.progressState);
    } catch (error) {
      console.error('saving progress failed', error);
    }
  }

  /** Plays a script; resolves true if it finished, false if it was stopped or interrupted. */
  private async play(script: Script): Promise<boolean> {
    const generation = ++this.generation;
    if (!this.deps.visibility.isVisible()) {
      this.interruptedPhase = this.phase;
      return false;
    }
    if (script.length === 0) return true;
    const handle = this.deps.audio.play(script, this.current?.instrument ?? 'piano', (label) => {
      if (generation !== this.generation) return;
      this.label = label;
      this.emit();
    });
    this.handle = handle;
    await handle.done;
    if (this.handle === handle) this.handle = null;
    return generation === this.generation;
  }

  private stopAudio(): void {
    this.generation++;
    this.handle?.stop();
    this.handle = null;
  }

  private onVisibility(visible: boolean): void {
    if (this.phase === 'ended' || this.phase === 'idle') return;
    if (!visible) {
      if (this.handle) {
        this.interruptedPhase = this.phase;
        this.stopAudio();
      }
      return;
    }
    const interrupted = this.interruptedPhase;
    this.interruptedPhase = null;
    if (interrupted) void this.resume(interrupted);
  }

  private async resume(phase: Phase): Promise<void> {
    switch (phase) {
      case 'intro':
        return this.nextQuestion();
      case 'playing':
      case 'awaiting':
        return this.playQuestion();
      case 'confirming':
        return this.afterAnswer();
      case 'feedback':
        return this.playCorrection();
      default:
        return this.nextQuestion();
    }
  }

  private async logStageStart(): Promise<void> {
    const { strand, stage } = this.stageInfo();
    await this.deps.log.record({
      type: 'stage_start',
      strandId: strand.id,
      stageId: stage.id,
      level: this.progressState.level,
      points: this.progressState.points,
      review: isCurriculumComplete(
        this.deps.curriculum,
        new Set(this.progressState.clearedStageIds),
      ),
    });
  }

  private async afterAnswer(): Promise<void> {
    this.label = null;
    if (this.pendingClear) {
      this.pendingClear = false;
      this.levelUp = this.progressState.level;
      this.setPhase('levelup');
      await this.deps.sleep(LEVEL_UP_MS);
      this.levelUp = null;
      if (this.phase !== 'levelup') return;
      await this.logStageStart();
    }
    await this.nextQuestion();
  }

  private async nextQuestion(): Promise<void> {
    if (this.phase === 'ended') return;
    this.label = null;
    if (this.timeUp()) return this.end('time');
    const { strand, stage, exercise } = this.stageInfo();
    const p = this.progressState;
    const instrument = await this.deps.audio.load(
      chooseInstrument(
        p.level,
        this.deps.curriculum.instrumentThresholdLevel,
        this.deps.instruments,
        this.deps.settings.excludedInstruments,
        this.deps.rng,
      ),
    );

    if (p.introducedStageId !== stage.id) {
      const fresh = newItems(this.deps.curriculum, stage.id);
      if (fresh.length > 0) {
        this.current = this.placeholder(strand, stage, exercise, instrument);
        this.setPhase('intro');
        for (const item of fresh) {
          const finished = await this.play(exercise.introScript(stage, item, this.deps.rng));
          if (!finished) return;
        }
        await this.deps.log.record({ type: 'item_intro', stageId: stage.id, items: fresh });
      }
      this.progressState = { ...this.progressState, introducedStageId: stage.id };
      await this.persist();
    }

    const item = chooseItem(this.deps.rng, stage.items, p.itemWeights, p.recentItems);
    this.current = {
      strand,
      stage,
      exercise,
      question: exercise.generate(stage, item, this.deps.rng),
      instrument,
      enabledAt: null,
      replays: 0,
      answer: null,
    };
    this.lastCorrect = null;
    await this.playQuestion();
  }

  private placeholder(
    strand: Strand,
    stage: Stage,
    exercise: ExerciseType,
    instrument: string,
  ): Current {
    return {
      strand,
      stage,
      exercise,
      question: {
        exercise: exercise.name,
        item: '',
        root: 60,
        register: stage.params.register,
        script: [],
      },
      instrument,
      enabledAt: null,
      replays: 0,
      answer: null,
    };
  }

  private async playQuestion(): Promise<void> {
    const c = this.current;
    if (!c) return;
    this.label = null;
    this.setPhase('playing');
    const finished = await this.play(c.question.script);
    if (!finished) return;
    c.enabledAt ??= this.deps.clock.now();
    this.setPhase('awaiting');
  }

  private async playCorrection(): Promise<void> {
    const c = this.current;
    if (!c || c.answer === null) return;
    this.continueEnabled = false;
    this.label = null;
    this.setPhase('feedback');
    const finished = await this.play(c.exercise.correctionScript(c.question, c.answer));
    if (!finished) return;
    this.continueEnabled = true;
    this.emit();
  }

  private async end(reason: 'time' | 'early'): Promise<void> {
    this.stopAudio();
    this.phase = 'ended';
    const durationSec = Math.round(this.elapsedMs() / 1000);
    this.timer?.dispose();
    this.unsubscribeVisibility?.();
    await this.deps.log.record({
      type: 'session_end',
      reason,
      durationSec,
      questions: this.questions,
      levelsGained: this.progressState.level - this.startLevel,
    });
    const { stage } = this.stageInfo();
    this.summary = {
      level: this.progressState.level,
      points: this.progressState.points,
      target: stageTarget(stage, this.deps.curriculum.scoring),
      levelsGained: this.progressState.level - this.startLevel,
    };
    this.label = null;
    this.emit();
  }
}
