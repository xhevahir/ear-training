# Spec Delta

## Purpose

Produces realistic, accurately timed musical sound for questions and feedback using sampled instruments, starting with piano and later varying the instrument, while respecting the learner's instrument exclusions.

## ADDED Requirements

### Requirement: Sampled instrument playback
All musical sound SHALL be produced from recorded instrument samples, tuned to twelve-tone equal temperament at A4 = 440 Hz. Chords SHALL sound with all their tones starting together, and successive notes SHALL be evenly timed without audible gaps or drift.

#### Scenario: Cadence timing
- **WHEN** a I-IV-V-I cadence plays
- **THEN** each chord's tones start together and the four chords are evenly spaced

### Requirement: Piano is the default instrument
Piano SHALL be available from first launch and SHALL be used for all questions below the instrument threshold level.

#### Scenario: New learner
- **WHEN** a new learner answers questions
- **THEN** all sound is piano

### Requirement: Random instruments with exclusion
From the instrument threshold level onward, each question SHALL use one instrument chosen at random from the available instruments the learner has not excluded, and all audio for that question, including feedback, SHALL use it. Piano SHALL NOT be excludable, so at least one instrument always remains.

#### Scenario: Excluded instrument
- **WHEN** the learner has excluded harpsichord
- **THEN** no question uses harpsichord

#### Scenario: Feedback uses question instrument
- **WHEN** a question played on organ is answered wrongly
- **THEN** the corrective feedback also plays on organ

### Requirement: Audio unlock on first interaction
Audio SHALL be enabled by the learner's first Start action, so that playback works on browsers that block sound before user interaction.

#### Scenario: Mobile browser
- **WHEN** the learner presses Start on an Android browser
- **THEN** the first question is audible

### Requirement: Instrument samples load before use
The system SHALL ensure an instrument's samples are loaded before any question uses it. If an instrument's samples cannot be loaded, the system SHALL use another available instrument instead of failing the question.

#### Scenario: Sample load failure
- **WHEN** the selected instrument's samples fail to load
- **THEN** the question plays on piano and practice continues
