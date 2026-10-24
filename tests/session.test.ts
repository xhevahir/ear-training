import { describe, expect, it } from 'vitest';
import { findStage } from '../src/core/curriculum';
import { newProgress } from '../src/core/progress';
import { curriculumV1 } from '../src/data/curriculum-v1';
import { flush, setup } from './session-helpers';

/** Progress on a stage that has no new items (so no intro plays). */
const midStage = () => ({
  ...newProgress(curriculumV1),
  introducedStageId: 'int-harm-fixed-02',
});

describe('session flow (8.1)', () => {
  it('plays the intro, then a question, then accepts an answer', async () => {
    const t = setup();
    await t.session.start();
    await flush();
    expect(t.audio.plays[0]!.script.some((e) => e.label)).toBe(true); // intro of TT
    expect(t.view().phase).toBe('awaiting');
    expect(t.view().options).toEqual(['TT', 'P8']);
  });

  it('a correct answer scores, saves and moves straight on', async () => {
    const t = setup({ progress: midStage() });
    await t.session.start();
    await flush();
    await t.session.answer(t.item());
    await flush();
    expect(t.view()).toMatchObject({ phase: 'awaiting', points: 1, lastCorrect: null });
    expect(t.saved.at(-1)!.points).toBe(1);
  });

  it('a wrong answer shows feedback and waits for Continue', async () => {
    const t = setup({ progress: { ...midStage(), points: 5 } });
    await t.session.start();
    await flush();
    const asked = t.item();
    await t.session.answer(t.wrong());
    await flush();
    expect(t.view().phase).toBe('feedback');
    expect(t.view().feedback).toMatchObject({ correct: asked, continueEnabled: true });
    expect(t.view().points).toBe(2);
    await t.session.continue();
    await flush();
    expect(t.view().phase).toBe('awaiting');
  });

  it('clears a stage mid-session, announces the level and continues in the next stage', async () => {
    const t = setup({ progress: { ...midStage(), points: 15 } });
    await t.session.start();
    await flush();
    await t.session.answer(t.item());
    await flush();
    expect(t.views.some((v) => v.phase === 'levelup' && v.levelUp === 2)).toBe(true);
    expect(t.view()).toMatchObject({ phase: 'awaiting', level: 2, points: 0, options: ['1', '5'] });
    const types = t.events.map((e) => e.type);
    expect(types).toContain('stage_cleared');
    expect(types.filter((x) => x === 'stage_start')).toHaveLength(2);
  });
});

describe('answer gating and feedback (8.2)', () => {
  it('ignores answers while the question is playing', async () => {
    const t = setup({ progress: midStage() });
    t.audio.auto = false;
    void t.session.start();
    await flush();
    expect(t.view().phase).toBe('playing');
    await t.session.answer('TT');
    expect(t.saved).toHaveLength(0);
    t.audio.last().finish();
    await flush();
    expect(t.view().phase).toBe('awaiting');
  });

  it('replays the question for free and logs the replay count', async () => {
    const t = setup({ progress: { ...midStage(), points: 4 } });
    await t.session.start();
    await flush();
    const plays = t.audio.plays.length;
    await t.session.replay();
    await flush();
    expect(t.audio.plays.length).toBe(plays + 1);
    expect(t.view().points).toBe(4);
    await t.session.answer(t.item());
    await flush();
    expect(t.events.find((e) => e.type === 'answer')).toMatchObject({ replays: 1, correct: true });
  });

  it('keeps Continue unavailable until the correction has finished', async () => {
    const t = setup({ progress: midStage() });
    await t.session.start();
    await flush();
    t.audio.auto = false;
    void t.session.answer(t.wrong());
    await flush();
    expect(t.view().feedback!.continueEnabled).toBe(false);
    await t.session.continue();
    expect(t.view().phase).toBe('feedback');
    t.audio.last().finish();
    await flush();
    expect(t.view().feedback!.continueEnabled).toBe(true);
    // hear again replays the correction, then Continue is available again
    void t.session.hearAgain();
    await flush();
    expect(t.view().feedback!.continueEnabled).toBe(false);
    t.audio.last().finish();
    await flush();
    expect(t.view().feedback!.continueEnabled).toBe(true);
  });

  it('labels the feedback with the correct answer', async () => {
    const t = setup({ progress: midStage() });
    await t.session.start();
    await flush();
    const asked = t.item();
    await t.session.answer(t.wrong());
    await flush();
    expect(t.views.some((v) => v.label === `It was ${asked}`)).toBe(true);
  });
});

describe('session timer (8.3)', () => {
  it('finishes the current question, including feedback, after time elapses', async () => {
    const t = setup({ progress: midStage() });
    await t.session.start();
    await flush();
    t.clock.t = 10 * 60_000 + 1;
    await t.session.answer(t.wrong());
    await flush();
    expect(t.view().phase).toBe('feedback');
    await t.session.continue();
    await flush();
    expect(t.view().phase).toBe('ended');
    expect(t.view().summary).toMatchObject({ level: 1, levelsGained: 0 });
    expect(t.events.at(-1)).toMatchObject({ type: 'session_end', reason: 'time', questions: 1 });
  });

  it('does not count time while the app is hidden', async () => {
    const t = setup({ progress: midStage() });
    await t.session.start();
    await flush();
    t.clock.t = 4 * 60_000;
    t.visibility.set(false);
    t.clock.t = 9 * 60_000; // 5 minutes hidden
    t.visibility.set(true);
    t.clock.t = 10 * 60_000;
    await t.session.answer(t.item());
    await flush();
    expect(t.view().phase).toBe('awaiting');
    expect(t.view().remainingSec).toBe(300);
  });

  it('honours the session length setting', async () => {
    const t = setup({ progress: midStage(), settings: { sessionMinutes: 15 } });
    await t.session.start();
    await flush();
    t.clock.t = 12 * 60_000;
    await t.session.answer(t.item());
    await flush();
    expect(t.view().phase).toBe('awaiting');
  });

  it('ends early on request, keeping progress', async () => {
    const t = setup({ progress: midStage() });
    await t.session.start();
    await flush();
    await t.session.answer(t.item());
    await flush();
    await t.session.endEarly();
    expect(t.view().phase).toBe('ended');
    expect(t.saved.at(-1)!.points).toBe(1);
    expect(t.events.at(-1)).toMatchObject({ type: 'session_end', reason: 'early' });
  });

  it('stops audio when hidden mid-question and replays the question on return', async () => {
    const t = setup({ progress: midStage() });
    t.audio.auto = false;
    void t.session.start();
    await flush();
    const first = t.audio.last();
    t.visibility.set(false);
    await flush();
    expect(first.stopped).toBe(true);
    expect(t.view().phase).toBe('playing');
    t.visibility.set(true);
    await flush();
    expect(t.audio.last()).not.toBe(first);
    expect(t.audio.last().script).toEqual(first.script);
    t.audio.last().finish();
    await flush();
    expect(t.view().phase).toBe('awaiting');
    expect(t.saved).toHaveLength(0);
  });
});

describe('intro and persistence (8.4)', () => {
  it('saves progress after every answer', async () => {
    const t = setup({ progress: midStage() });
    await t.session.start();
    await flush();
    for (let i = 0; i < 3; i++) {
      await t.session.answer(t.item());
      await flush();
    }
    expect(t.saved.map((p) => p.points)).toEqual([1, 2, 3]);
  });

  it('logs the introduction of new items once and does not repeat it on resume', async () => {
    const stage = findStage(curriculumV1, 'deg-diat-fixed-05')!.stage;
    const progress = { ...newProgress(curriculumV1), currentStageId: stage.id, itemWeights: {} };
    const t = setup({ progress });
    await t.session.start();
    await flush();
    expect(t.events.filter((e) => e.type === 'item_intro')).toEqual([
      { type: 'item_intro', stageId: 'deg-diat-fixed-05', items: ['4'] },
    ]);
    const resumed = setup({ progress: t.saved.at(-1)! });
    await resumed.session.start();
    await flush();
    expect(resumed.events.some((e) => e.type === 'item_intro')).toBe(false);
  });

  it('uses random instruments from the threshold level, falling back to piano on failure', async () => {
    const t = setup({ progress: { ...midStage(), level: 21 } });
    t.audio.failing.add('organ');
    await t.session.start();
    await flush();
    for (let i = 0; i < 8; i++) {
      await t.session.answer(t.item());
      await flush();
    }
    expect(new Set(t.audio.loads)).toEqual(new Set(['piano', 'organ']));
    expect(t.audio.plays.every((p) => p.instrument === 'piano')).toBe(true);
  });
});
