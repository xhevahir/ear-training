# Spec Delta

## Purpose

Defines the learner's practice session: a single Start action that resumes exactly where they left off, a time-boxed question loop, mandatory feedback that always lets the learner hear the correct answer, and a clean end.

## ADDED Requirements

### Requirement: One-action start that resumes progress
The home screen SHALL show the current level, the progress bar, and a single Start control. Starting SHALL resume at the learner's current stage with its saved points. The system SHALL NOT ask the learner to choose an exercise.

#### Scenario: Returning learner
- **WHEN** a learner who ended their last session at level 8 with 6 points presses Start
- **THEN** practice begins in the level 8 stage with 6 points

#### Scenario: First launch
- **WHEN** a learner opens the app for the first time
- **THEN** the home screen shows level 1 with an empty progress bar and a Start control

### Requirement: Sessions are time-boxed
A session SHALL last for the configured session length (default 10 minutes) of active time from Start; time while the app is hidden or in the background SHALL NOT count. When the time elapses, the system SHALL let the current question, including any feedback, finish, then end the session. The learner MAY end a session early at any time.

#### Scenario: Time elapses mid-question
- **WHEN** the session time elapses while a question is being answered
- **THEN** the learner finishes that question and its feedback, and then the session ends

#### Scenario: App backgrounded
- **WHEN** the learner switches away from the app for 5 minutes during a session
- **THEN** those 5 minutes do not count toward the session length

#### Scenario: Session length setting
- **WHEN** the learner sets the session length to 15 minutes
- **THEN** subsequent sessions last 15 minutes

#### Scenario: Early exit
- **WHEN** the learner ends the session before time elapses
- **THEN** the session ends and all progress up to the last answered question is kept

### Requirement: Level-ups continue within a session
When a stage is cleared during a session, the system SHALL briefly announce the new level and continue the session in the next stage.

#### Scenario: Stage cleared mid-session
- **WHEN** the learner clears a stage with 4 minutes remaining
- **THEN** a level-up announcement is shown and practice continues in the next stage

### Requirement: Answers are accepted only after the question has played
Answer controls SHALL be disabled while the question audio (including any key-establishing context) is playing, and enabled when it finishes. The learner SHALL be able to replay the question before answering, at no cost.

#### Scenario: Answering during playback
- **WHEN** the question is still playing
- **THEN** the answer controls cannot be activated

#### Scenario: Replay
- **WHEN** the learner requests a replay before answering
- **THEN** the question is played again and points are unaffected

### Requirement: Correct answer is always heard before continuing
After a wrong answer the system SHALL show the correct answer and play the exercise's corrective feedback. The control to continue SHALL be unavailable until that feedback has finished playing. The learner SHALL be able to hear the feedback again before continuing.

#### Scenario: Wrong answer
- **WHEN** the learner answers wrongly
- **THEN** the correct answer is shown, corrective audio plays, and Continue becomes available only after playback ends

#### Scenario: Hear again
- **WHEN** the learner requests to hear the feedback again
- **THEN** the corrective audio plays again and Continue remains available afterwards

### Requirement: Correct answers continue automatically
After a correct answer the system SHALL confirm it visibly, play any exercise-specific confirmation audio, and proceed to the next question without requiring input.

#### Scenario: Correct answer
- **WHEN** the learner answers correctly
- **THEN** a confirmation is shown and the next question begins after any confirmation audio

### Requirement: End-of-session summary
When a session ends the system SHALL show the current level, the progress bar, and the number of levels gained during the session, and return to the home screen.

#### Scenario: Summary after leveling up
- **WHEN** a session ends in which the learner gained one level
- **THEN** the summary shows the new level, its progress, and "+1 level"

### Requirement: Settings never select practice content
Settings SHALL be limited to session length, instrument exclusion, and keyboard labels, plus data utilities (progress export/import, practice-log export). No setting SHALL change which stage, strand, or items are practised.

#### Scenario: Settings screen contents
- **WHEN** the learner opens settings
- **THEN** only session length, instrument exclusion, keyboard labels, progress export/import, and practice-log export are available

### Requirement: Keyboard shortcuts on desktop
On devices with a keyboard, each answer SHALL be selectable by a key chosen by physical position and semitone size: Space = octave (intervals) or 1 (scale degrees); U, J, I, K, L, O, ; = 1-7 semitones; E, D, R, F = 8-11 semitones. Enter SHALL start a session and continue after feedback; Backspace SHALL replay the question or hear the feedback again. Keys SHALL obey the same availability rules as the on-screen controls.

#### Scenario: Answering an interval by key
- **WHEN** answers are being accepted and the learner presses L in an interval stage that includes P4
- **THEN** P4 is submitted as the answer

#### Scenario: Answering a scale degree by key
- **WHEN** answers are being accepted and the learner presses E in a scale-degree stage that includes b6
- **THEN** b6 is submitted as the answer

#### Scenario: Key for an item not in the stage
- **WHEN** the learner presses a key whose item is not offered in the current stage
- **THEN** nothing happens

#### Scenario: Continue by key before feedback finishes
- **WHEN** corrective feedback is still playing and the learner presses Enter
- **THEN** nothing happens

### Requirement: Keyboard labels follow the learner's layout
On devices with a fine pointer, each answer control SHALL show its shortcut key. A keyboard-labels setting (QWERTY or Dvorak, default QWERTY) SHALL change only these labels, so that they name the character the learner's layout produces at each key position; the physical keys used SHALL NOT change.

#### Scenario: Dvorak labels
- **WHEN** the learner selects Dvorak labels and an interval stage offers m2 and P5
- **THEN** the m2 control is labelled "g" and the P5 control "s", and the keys at those physical positions answer them
