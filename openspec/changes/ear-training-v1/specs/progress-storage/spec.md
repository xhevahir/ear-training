# Spec Delta

## Purpose

Keeps the learner's progress and settings on their device so they can always pick up where they left off, and lets them move progress between devices without an account or server.

## ADDED Requirements

### Requirement: Progress is saved after every answer
The system SHALL persist the learner's progress (cleared stages, current stage, current stage points, per-item selection weights, strand practice recency) on the device after every answered question.

#### Scenario: App closed mid-session
- **WHEN** the learner closes the app after answering a question
- **THEN** reopening the app shows the same level and points as after that answer

### Requirement: Settings are saved
The system SHALL persist session length and instrument exclusions on the device.

#### Scenario: Settings survive restart
- **WHEN** the learner changes the session length and reopens the app
- **THEN** the new session length is in effect

### Requirement: Progress export
The system SHALL let the learner export their progress and settings as a single file.

#### Scenario: Export
- **WHEN** the learner chooses to export progress
- **THEN** a file containing their progress and settings is saved to the device

### Requirement: Progress import
The system SHALL let the learner import a previously exported progress file, replacing current progress after confirmation. Invalid or unrecognised files SHALL be rejected without changing current progress.

#### Scenario: Import on another device
- **WHEN** the learner imports a file exported at level 12 and confirms
- **THEN** the app shows level 12 with the exported points

#### Scenario: Invalid file
- **WHEN** the learner imports a file that is not a valid progress export
- **THEN** an error is shown and current progress is unchanged

### Requirement: Progress survives curriculum updates
When the curriculum data changes between app versions, saved progress SHALL be mapped onto the new curriculum by stable stage identifiers. Stages that no longer exist SHALL be dropped, and if the current stage no longer exists, the learner SHALL resume at the next uncleared stage. The learner's level SHALL NOT decrease.

#### Scenario: Stage inserted in a new version
- **WHEN** a new curriculum version inserts a stage before the learner's current stage
- **THEN** the learner keeps their current stage and points, and the inserted stage is scheduled through normal interleaving
