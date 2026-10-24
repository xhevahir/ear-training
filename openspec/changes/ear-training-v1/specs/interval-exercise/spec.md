# Spec Delta

## Purpose

Trains recognising intervals between two tones, played together (harmonic) or in succession (ascending or descending melodic), with feedback that contrasts the learner's answer with the correct interval.

## ADDED Requirements

### Requirement: Interval presentation
Each interval question SHALL play two tones separated by the target interval, using the stage's direction: harmonic (simultaneous), melodic ascending, melodic descending, or mixed (each question randomly one of the three). The intervals in scope SHALL be the twelve from minor second to octave.

#### Scenario: Harmonic stage
- **WHEN** a question is asked in a harmonic stage
- **THEN** both tones sound simultaneously

#### Scenario: Melodic descending stage
- **WHEN** a question is asked in a melodic descending stage
- **THEN** the upper tone sounds first, followed by the lower tone

### Requirement: Root policy
The lower tone (harmonic or ascending) or the first tone (descending) SHALL be C4 in fixed-root stages, and SHALL be chosen at random per question within a comfortable mid range in moving-root stages, such that both tones remain within the instrument's playable range.

#### Scenario: Fixed-root stage
- **WHEN** an ascending perfect fifth is asked in a fixed-root stage
- **THEN** the tones are C4 then G4

#### Scenario: Moving-root stage
- **WHEN** consecutive questions are asked in a moving-root stage
- **THEN** their root pitches vary

### Requirement: Answer by interval name
The answer controls SHALL show only the stage's intervals, labelled by standard abbreviation (m2, M2, m3, M3, P4, TT, P5, m6, M6, m7, M7, P8), in size order.

#### Scenario: First stage
- **WHEN** the stage's items are TT and P8
- **THEN** exactly two answer controls labelled TT and P8 are shown

### Requirement: Wrong answer contrasts chosen and correct intervals
After a wrong answer, the system SHALL play the interval the learner chose, then the correct interval in the question's direction, then the correct interval's two tones melodically from low to high, then the correct interval again in the question's direction. All feedback SHALL use the question's root and instrument.

#### Scenario: P4 chosen for a harmonic P5
- **WHEN** the question was a harmonic P5 on D and the learner answered P4
- **THEN** the system plays harmonic D-G (labelled "You said P4"), harmonic D-A (labelled "It was P5"), D then A, and harmonic D-A again

### Requirement: Correct answer needs no extra audio
After a correct interval answer, the system SHALL play no confirmation audio.

#### Scenario: Correct answer
- **WHEN** the learner answers an interval correctly
- **THEN** the next question begins after the visual confirmation
