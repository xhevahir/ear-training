# Spec Delta

## Purpose

Records what happens during practice in enough detail that the curriculum order, stage sizes, and tuning numbers can be analysed and adjusted from real data, and exports that record in a form a person or an analysis tool can read.

## ADDED Requirements

### Requirement: Every answer is logged
For each answered question the system SHALL record an event containing: timestamp, app and curriculum versions, strand and stage identifiers, level, the item asked, the answer given, correctness, response time from answer controls becoming enabled to answer, number of replays, key or root, direction (intervals), register, instrument, and stage points before and after.

#### Scenario: Wrong answer logged
- **WHEN** the learner answers P4 to a harmonic P5 on D played on piano after one replay
- **THEN** an answer event is recorded with item P5, answer P4, correct false, root D, direction harmonic, instrument piano, replays 1, and the points before and after

### Requirement: Session and progression events are logged
The system SHALL record events for session start, session end (with reason: time elapsed or ended early, and duration), stage start, new-item introduction, and stage cleared (with the number of questions it took).

#### Scenario: Stage cleared
- **WHEN** the learner clears a stage after 52 questions
- **THEN** a stage-cleared event is recorded with the stage identifier, new level, and question count 52

### Requirement: Log is stored locally and retained
The log SHALL be stored on the device alongside progress, SHALL survive app restarts and updates, and SHALL NOT be sent anywhere by the app.

#### Scenario: Log after restart
- **WHEN** the learner practises, closes the app, and reopens it
- **THEN** all earlier log events are still present

### Requirement: Log export
The system SHALL let the learner export the full log as a file of newline-delimited JSON, one event per line, each event including an event type and the fields above, with a header line describing the format version.

#### Scenario: Export log
- **WHEN** the learner chooses to export the practice log
- **THEN** a newline-delimited JSON file containing a format header and every recorded event in chronological order is saved to the device

### Requirement: Logging never disrupts practice
A failure to record a log event SHALL NOT interrupt practice or prevent progress from being saved.

#### Scenario: Storage write fails for a log event
- **WHEN** a log event cannot be stored
- **THEN** the session continues and progress is still saved
