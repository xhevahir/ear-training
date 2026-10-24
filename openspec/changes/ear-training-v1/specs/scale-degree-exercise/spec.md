# Spec Delta

## Purpose

Trains hearing a tone by its function in a key: the app establishes a key, plays a tone, and the learner names its scale degree, with feedback that connects the tone to the tonic.

## ADDED Requirements

### Requirement: Key is established before every question
Each scale-degree question SHALL begin with a I-IV-V-I cadence in the question's key, followed by a single target tone. The key SHALL be C major when the stage uses a fixed key, and a randomly chosen major key otherwise.

#### Scenario: Fixed-key stage
- **WHEN** a question is asked in a fixed-key stage
- **THEN** a I-IV-V-I cadence in C major plays, then the target tone

#### Scenario: Moving-key stage
- **WHEN** consecutive questions are asked in a moving-key stage
- **THEN** each question's cadence is in a randomly chosen major key, and the target tone belongs to that key's context

### Requirement: Target tone register
The target tone SHALL lie within one octave above the tonic in single-octave stages, and anywhere within two octaves around the tonic in wide-register stages.

#### Scenario: Single-octave stage
- **WHEN** a question asks for degree 5 in C in a single-octave stage
- **THEN** the target tone is the G above the tonic C

#### Scenario: Wide-register stage
- **WHEN** a question is asked in a wide-register stage
- **THEN** the target tone may be in either of the two octaves

### Requirement: Answer by scale degree
The answer controls SHALL show the stage's items as scale-degree labels (1, 2, 3, 4, 5, 6, 7 and chromatic degrees b2, b3, #4, b6, b7), in pitch order. Only the stage's items SHALL be offered as answers.

#### Scenario: Stage with four items
- **WHEN** the stage's items are 1, 3, 5, 7
- **THEN** exactly four answer controls labelled 1, 3, 5, 7 are shown

### Requirement: Correct answer resolves to the tonic
After a correct answer, the system SHALL play a brief stepwise resolution from the target tone to a tonic, following a per-degree resolution table defined as data.

#### Scenario: Correct leading tone
- **WHEN** the learner correctly answers 7
- **THEN** the system plays 7 resolving up to 1

#### Scenario: Correct supertonic
- **WHEN** the learner correctly answers 2
- **THEN** the system plays 2 resolving down to 1

### Requirement: Wrong answer walks from the tonic to the target
After a wrong answer, the system SHALL play the tonic and ascend stepwise through the major scale to the target tone, holding the target. For a chromatic target, the walk SHALL ascend the major scale to the diatonic degree below the target and finish with a chromatic step.

#### Scenario: Wrong answer on a diatonic degree
- **WHEN** the target was 3 and the learner answered 6
- **THEN** the system plays 1, 2, then holds 3

#### Scenario: Wrong answer on a chromatic degree
- **WHEN** the target was b6
- **THEN** the system plays 1, 2, 3, 4, 5, then holds b6

#### Scenario: Wrong answer on the tonic
- **WHEN** the target was 1
- **THEN** the system plays and holds the tonic
