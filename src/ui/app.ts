import { excludable, type InstrumentInfo } from '../audio/instruments';
import type { Curriculum } from '../core/curriculum';
import { findStage } from '../core/curriculum';
import type { Progress } from '../core/progress';
import { mathRng } from '../core/rng';
import { isCurriculumComplete } from '../core/scheduler';
import { stageTarget } from '../core/scoring';
import type { ExerciseRegistry } from '../exercises/registry';
import { newSessionId, type PracticeLog } from '../log/practice-log';
import { browserClock, documentVisibility } from '../session/browser';
import type { AudioPort } from '../session/ports';
import { Session, type SessionView } from '../session/session';
import type { Database } from '../storage/db';
import {
  persistenceStatus,
  requestPersistence,
  type PersistenceStatus,
} from '../storage/persistence';
import {
  KEYBOARD_LAYOUTS,
  saveProgress,
  saveSettings,
  type KeyboardLayout,
  type Settings,
} from '../storage/progress-store';
import { exportProgress, importProgress } from '../storage/transfer';
import { dateStamp, download, h, progressBar } from './dom';
import { answerForKey, commandForKey, keyHint } from './keys';

export interface AppDeps {
  root: HTMLElement;
  db: Database;
  curriculum: Curriculum;
  registry: ExerciseRegistry;
  audio: AudioPort;
  log: PracticeLog;
  instruments: InstrumentInfo[];
  progress: Progress;
  settings: Settings;
}

const SESSION_LENGTHS = [5, 10, 15, 20, 30];

/** Top-level UI: home, session, summary and settings screens. */
export class App {
  private progress: Progress;
  private settings: Settings;
  private session: Session | null = null;
  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private screen: 'home' | 'session' | 'summary' | 'settings' = 'home';
  private persistence: PersistenceStatus = 'unsupported';

  constructor(private readonly deps: AppDeps) {
    this.progress = deps.progress;
    this.settings = deps.settings;
    void persistenceStatus().then((s) => (this.persistence = s));
    document.addEventListener('keydown', (e) => this.onKey(e));
  }

  // --- home ---

  showHome(): void {
    this.screen = 'home';
    const target = this.target();
    const complete = isCurriculumComplete(
      this.deps.curriculum,
      new Set(this.progress.clearedStageIds),
    );
    this.render(
      h(
        'main',
        { class: 'screen home' },
        h('h1', { class: 'app-title' }, 'Ear Training'),
        h('p', { class: 'level' }, `Level ${this.progress.level}`),
        progressBar(this.progress.points, target),
        h('p', { class: 'muted' }, `${this.progress.points} / ${target}`),
        complete
          ? h('p', { class: 'note' }, 'Curriculum complete — sessions now review every strand.')
          : null,
        h('button', { class: 'primary start', onclick: () => void this.startSession() }, 'Start'),
        h('button', { class: 'link', onclick: () => this.showSettings() }, 'Settings'),
      ),
    );
  }

  // --- session ---

  private async startSession(): Promise<void> {
    this.deps.log.sessionId = newSessionId();
    this.session = new Session(
      {
        curriculum: this.deps.curriculum,
        registry: this.deps.registry,
        audio: this.deps.audio,
        log: this.deps.log,
        clock: browserClock,
        visibility: documentVisibility,
        rng: mathRng,
        instruments: this.deps.instruments,
        settings: this.settings,
        save: (p) => saveProgress(this.deps.db, p),
        sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
        onChange: (view) => this.renderSession(view),
      },
      this.progress,
    );
    // Dev-only hook for automated browser checks; stripped from production builds.
    if (import.meta.env.DEV) (window as unknown as { __session: Session }).__session = this.session;
    this.renderSession(this.session.view());
    // update only the remaining-time text each second, without re-rendering the buttons
    this.clockTimer = setInterval(() => {
      const el = this.deps.root.querySelector('.session-header .time');
      if (el && this.session) el.textContent = formatTime(this.session.view().remainingSec);
    }, 1000);
    void requestPersistence().then((s) => (this.persistence = s));
    try {
      await this.session.start();
    } catch (error) {
      console.error(error);
      this.render(
        h(
          'main',
          { class: 'screen' },
          h('h2', {}, 'Sound could not be started'),
          h('p', {}, 'Check your connection the first time you use the app, then try again.'),
          h('button', { class: 'primary', onclick: () => this.showHome() }, 'Back'),
        ),
      );
    }
  }

  private renderSession(view: SessionView): void {
    const session = this.session;
    if (!session) return;
    this.progress = session.progress;
    if (view.phase === 'ended') return this.showSummary(view);
    this.screen = 'session';

    const status = statusText(view);
    const answers = h(
      'div',
      { class: `answers n${view.options.length}` },
      ...view.options.map((option) =>
        h(
          'button',
          {
            class: answerClass(option, view),
            'data-answer': option,
            disabled: view.phase !== 'awaiting',
            onclick: () => void session.answer(option),
          },
          option,
          keyHintEl(option, this.settings.keyboardLayout),
        ),
      ),
    );

    this.render(
      h(
        'main',
        { class: 'screen session' },
        h(
          'header',
          { class: 'session-header' },
          h('span', { class: 'level-small' }, `Level ${view.level}`),
          h('span', { class: 'muted time' }, formatTime(view.remainingSec)),
          h('button', { class: 'link', onclick: () => void session.endEarly() }, 'End'),
        ),
        progressBar(view.points, view.target),
        view.levelUp !== null
          ? h('div', { class: 'levelup', role: 'status' }, `Level ${view.levelUp}!`)
          : null,
        h(
          'p',
          { class: `status ${view.lastCorrect === true ? 'good' : ''}`, 'aria-live': 'polite' },
          status,
        ),
        h('p', { class: 'label', 'aria-live': 'polite' }, view.label ?? ' '),
        answers,
        view.feedback
          ? h(
              'div',
              { class: 'feedback-actions' },
              h(
                'button',
                {
                  'data-action': 'hear-again',
                  disabled: !view.feedback.continueEnabled,
                  onclick: () => void session.hearAgain(),
                },
                'Hear again',
              ),
              h(
                'button',
                {
                  class: 'primary',
                  'data-action': 'continue',
                  disabled: !view.feedback.continueEnabled,
                  onclick: () => void session.continue(),
                },
                'Continue',
              ),
            )
          : h(
              'div',
              { class: 'feedback-actions' },
              h(
                'button',
                {
                  'data-action': 'replay',
                  disabled: view.phase !== 'awaiting',
                  onclick: () => void session.replay(),
                },
                'Replay',
              ),
            ),
      ),
    );
  }

  private showSummary(view: SessionView): void {
    this.screen = 'summary';
    const s = view.summary!;
    this.session = null;
    if (this.clockTimer !== null) clearInterval(this.clockTimer);
    this.clockTimer = null;
    this.render(
      h(
        'main',
        { class: 'screen summary' },
        h('h2', {}, 'Session complete'),
        h('p', { class: 'level' }, `Level ${s.level}`),
        progressBar(s.points, s.target),
        h('p', { class: 'muted' }, `${s.points} / ${s.target}`),
        h(
          'p',
          { class: 'gained' },
          s.levelsGained > 0
            ? `+${s.levelsGained} level${s.levelsGained > 1 ? 's' : ''}`
            : 'Progress saved',
        ),
        h('button', { class: 'primary', onclick: () => this.showHome() }, 'Done'),
      ),
    );
  }

  // --- settings ---

  showSettings(message?: string): void {
    this.screen = 'settings';
    const lengths = h(
      'select',
      {
        id: 'session-length',
        onchange: (e: Event) =>
          void this.updateSettings({
            sessionMinutes: Number((e.target as HTMLSelectElement).value),
          }),
      },
      ...SESSION_LENGTHS.map((m) =>
        h('option', { value: m, selected: m === this.settings.sessionMinutes }, `${m} minutes`),
      ),
    );

    const layouts = h(
      'select',
      {
        id: 'keyboard-layout',
        onchange: (e: Event) =>
          void this.updateSettings({
            keyboardLayout: (e.target as HTMLSelectElement).value as KeyboardLayout,
          }),
      },
      ...KEYBOARD_LAYOUTS.map((layout) =>
        h(
          'option',
          { value: layout, selected: layout === this.settings.keyboardLayout },
          layout === 'qwerty' ? 'QWERTY' : 'Dvorak',
        ),
      ),
    );

    const instruments = h(
      'fieldset',
      { class: 'instruments' },
      h('legend', {}, 'Instruments'),
      h(
        'p',
        { class: 'muted' },
        `Used from level ${this.deps.curriculum.instrumentThresholdLevel}. Untick any you don't want to hear.`,
      ),
      h(
        'label',
        {},
        h('input', { type: 'checkbox', checked: true, disabled: true }),
        ' Piano (always on)',
      ),
      ...excludable(this.deps.instruments).map((inst) =>
        h(
          'label',
          {},
          h('input', {
            type: 'checkbox',
            checked: !this.settings.excludedInstruments.includes(inst.id),
            onchange: (e: Event) => {
              const on = (e.target as HTMLInputElement).checked;
              const excluded = new Set(this.settings.excludedInstruments);
              if (on) excluded.delete(inst.id);
              else excluded.add(inst.id);
              void this.updateSettings({ excludedInstruments: [...excluded] });
            },
          }),
          ` ${inst.name}`,
        ),
      ),
    );

    const fileInput = h('input', {
      type: 'file',
      accept: 'application/json,.json',
      class: 'hidden',
      onchange: (e: Event) => void this.importFile((e.target as HTMLInputElement).files?.[0]),
    });

    const storage =
      this.persistence === 'granted'
        ? h(
            'p',
            { class: 'muted' },
            'Your progress is stored on this device and protected from automatic clean-up.',
          )
        : h(
            'p',
            { class: 'note' },
            'This browser may clear stored data when space runs low. Export your progress now and then to keep a backup.',
          );

    this.render(
      h(
        'main',
        { class: 'screen settings' },
        h('h2', {}, 'Settings'),
        message ? h('p', { class: 'note', role: 'status' }, message) : null,
        h('label', { for: 'session-length', class: 'field' }, 'Session length ', lengths),
        h('label', { for: 'keyboard-layout', class: 'field' }, 'Keyboard labels ', layouts),
        instruments,
        h(
          'section',
          { class: 'data' },
          h('h3', {}, 'Your data'),
          storage,
          h('button', { onclick: () => this.exportProgressFile() }, 'Export progress'),
          h('button', { onclick: () => fileInput.click() }, 'Import progress…'),
          fileInput,
          h('button', { onclick: () => void this.exportLog() }, 'Export practice log'),
        ),
        h(
          'section',
          { class: 'about' },
          h('h3', {}, 'About'),
          h(
            'p',
            { class: 'muted' },
            `Version ${__APP_VERSION__}, curriculum ${this.deps.curriculum.version}.`,
          ),
          h(
            'p',
            { class: 'muted' },
            'Piano: Salamander Grand Piano by Alexander Holm. Other instruments: tonejs-instruments by Nicholaus P. Brosowsky (VSCO 2, Freesound, University of Iowa, Karoryfer). All samples CC-BY 3.0.',
          ),
        ),
        h('button', { class: 'primary', onclick: () => this.showHome() }, 'Back'),
      ),
    );
  }

  private async updateSettings(change: Partial<Settings>): Promise<void> {
    this.settings = { ...this.settings, ...change };
    await saveSettings(this.deps.db, this.settings);
  }

  private exportProgressFile(): void {
    download(
      `ear-training-progress-${dateStamp()}.json`,
      exportProgress(this.progress, this.settings),
      'application/json',
    );
  }

  private async exportLog(): Promise<void> {
    download(
      `ear-training-log-${dateStamp()}.ndjson`,
      await this.deps.log.exportNdjson(),
      'application/x-ndjson',
    );
  }

  private async importFile(file: File | undefined): Promise<void> {
    if (!file) return;
    try {
      const result = await importProgress(
        this.deps.db,
        this.deps.curriculum,
        await file.text(),
        async (f) =>
          window.confirm(
            `Replace your current progress (level ${this.progress.level}) with the imported progress (level ${f.progress.level}, exported ${f.exportedAt.slice(0, 10)})?`,
          ),
      );
      if (!result) return;
      this.progress = result.progress;
      this.settings = result.settings;
      this.showSettings(`Imported: level ${this.progress.level}.`);
    } catch (error) {
      this.showSettings(error instanceof Error ? error.message : 'Import failed.');
    }
  }

  // --- keyboard ---

  private onKey(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const target = e.target as HTMLElement | null;
    if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
    const command = commandForKey(e.code);

    if (this.screen === 'home' && command === 'confirm') {
      e.preventDefault();
      void this.startSession();
      return;
    }
    if (this.screen === 'summary' && command === 'confirm') {
      e.preventDefault();
      this.showHome();
      return;
    }
    const session = this.session;
    if (this.screen !== 'session' || !session) return;
    const view = session.view();
    const answer = answerForKey(e.code, view.options);
    if (answer !== undefined || command !== undefined || e.code === 'Space') e.preventDefault();
    if (answer !== undefined && view.phase === 'awaiting') void session.answer(answer);
    else if (command === 'confirm' && view.phase === 'feedback') void session.continue();
    else if (command === 'again' && view.phase === 'awaiting') void session.replay();
    else if (command === 'again' && view.phase === 'feedback') void session.hearAgain();
  }

  // --- helpers ---

  private target(): number {
    const found = findStage(this.deps.curriculum, this.progress.currentStageId);
    return found ? stageTarget(found.stage, this.deps.curriculum.scoring) : 0;
  }

  private render(screen: HTMLElement): void {
    this.deps.root.replaceChildren(screen);
  }
}

function keyHintEl(option: string, layout: KeyboardLayout): HTMLElement | null {
  const hint = keyHint(option, layout);
  return hint ? h('span', { class: 'key-hint', 'aria-hidden': 'true' }, hint) : null;
}

function statusText(view: SessionView): string {
  switch (view.phase) {
    case 'intro':
      return 'New sound — listen';
    case 'playing':
      return 'Listen…';
    case 'awaiting':
      return 'What did you hear?';
    case 'confirming':
      return 'Correct!';
    case 'feedback':
      return view.feedback ? `It was ${view.feedback.correct}` : '';
    case 'levelup':
      return 'Level up!';
    default:
      return '';
  }
}

function answerClass(option: string, view: SessionView): string {
  if (view.feedback) {
    if (option === view.feedback.correct) return 'answer correct';
    if (option === view.feedback.given) return 'answer wrong';
  }
  return 'answer';
}

function formatTime(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}
