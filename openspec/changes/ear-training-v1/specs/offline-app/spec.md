# Spec Delta

## Purpose

Lets the app be installed to a phone or desktop home screen and used without a network connection, with its stored progress protected from automatic browser cleanup.

## ADDED Requirements

### Requirement: Installable on desktop and Android
The app SHALL be installable from a supporting browser (including Chrome on Android) and SHALL then launch full-screen from its own icon.

#### Scenario: Install on Android
- **WHEN** the learner chooses "Add to Home screen" in Chrome on Android
- **THEN** an app icon is added and launching it opens the app without browser chrome

### Requirement: Works offline after first load
After the app has been loaded once with a network connection, it SHALL start and run full practice sessions without a network connection, using piano. Additional instruments SHALL be stored for offline use once they have been downloaded.

#### Scenario: Airplane mode
- **WHEN** the learner opens the installed app with no network connection
- **THEN** the app starts and a practice session runs normally

#### Scenario: Instrument downloaded earlier
- **WHEN** an instrument was downloaded while online and the device is now offline
- **THEN** questions can use that instrument

### Requirement: Stored data is protected from eviction
The app SHALL request persistent storage from the browser so that progress, the practice log, and cached audio are not cleared automatically under storage pressure.

#### Scenario: Persistent storage granted
- **WHEN** the browser grants persistent storage
- **THEN** saved data is retained until the learner clears it

#### Scenario: Persistent storage denied
- **WHEN** the browser denies persistent storage
- **THEN** the app continues to work and the settings screen recommends exporting progress periodically

### Requirement: Updates apply without losing progress
When a new app version is available, it SHALL take effect on a subsequent launch and SHALL NOT interrupt a session in progress or discard saved data.

#### Scenario: Update during session
- **WHEN** a new version becomes available while a session is running
- **THEN** the session completes on the current version and the new version is used on a later launch
