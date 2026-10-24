# Spec Delta

## Purpose

Defines the single, learner-invisible path through the training content: how content is organised into strands and stages, how the next stage is chosen, and how the learner earns progress and levels up without ever choosing what to practise.

## ADDED Requirements

### Requirement: Curriculum is defined as strands of stages
The curriculum SHALL consist of strands, each an ordered ladder of stages. Each stage SHALL fully specify what is practised: exercise type, item set, and every difficulty dimension (e.g. fixed or moving root, harmonic or melodic direction, register). The curriculum SHALL be defined as data separate from application logic.

#### Scenario: Stage specifies all dimensions
- **WHEN** a stage is loaded for practice
- **THEN** its exercise type, item set, root/key policy, direction (where applicable), and register are all determined by the stage definition alone

#### Scenario: Invalid curriculum is rejected
- **WHEN** curriculum data references an unknown exercise type, an unknown item, an unknown prerequisite, or a strand with no stages
- **THEN** the curriculum fails validation and is not used

### Requirement: Strands unlock through prerequisites
A strand MAY declare prerequisites, each naming a stage of another strand that must be cleared first. A strand SHALL be unlocked when all of its prerequisites are cleared; a strand with no prerequisites SHALL be unlocked from the start.

#### Scenario: Strand without prerequisites
- **WHEN** a new learner starts
- **THEN** every strand with no prerequisites is unlocked

#### Scenario: Prerequisite cleared
- **WHEN** the learner clears the last stage named in a strand's prerequisites
- **THEN** that strand becomes unlocked and eligible for selection

### Requirement: Next stage is chosen by interleaving
When the current stage is cleared, the system SHALL select the next stage from the unlocked, unfinished strand whose stages were practised least recently, taking that strand's next uncleared stage. Ties SHALL be broken by curriculum order. The learner SHALL NOT be offered any choice of stage or strand.

#### Scenario: Alternating between two strands
- **WHEN** two strands are unlocked and the learner clears a stage in strand B
- **THEN** the next stage is the next uncleared stage of strand A

#### Scenario: Only one strand remaining
- **WHEN** all other unlocked strands are finished
- **THEN** the next stage is taken from the remaining strand

#### Scenario: Curriculum completed
- **WHEN** every stage of every strand is cleared
- **THEN** the system informs the learner that the curriculum is complete and continues offering review practice from the final stage of each strand in rotation

### Requirement: Points are awarded per answer
Within the current stage the system SHALL add 1 point for each correct answer and subtract 3 points for each wrong answer. Points SHALL NOT fall below zero.

#### Scenario: Correct answer
- **WHEN** the learner answers correctly with 10 points
- **THEN** the stage has 11 points

#### Scenario: Wrong answer near zero
- **WHEN** the learner answers wrongly with 2 points
- **THEN** the stage has 0 points

### Requirement: Stage target grows with item count
A stage SHALL be cleared when its points reach a target of 10 + 3 x (number of items in the stage). On clearing, the learner's level SHALL increase by one, points SHALL reset to zero, and the next stage SHALL begin immediately.

#### Scenario: Clearing a two-item stage
- **WHEN** a stage with 2 items reaches 16 points
- **THEN** the stage is cleared, the level increases by one, and the next stage begins with 0 points

#### Scenario: Larger stage needs more points
- **WHEN** a stage has 12 items
- **THEN** its target is 46 points

### Requirement: Levels are never lost
The learner's level SHALL start at 1, increase by one each time a stage is cleared, and never decrease, including across curriculum updates.

#### Scenario: Repeated mistakes
- **WHEN** the learner makes many consecutive wrong answers
- **THEN** stage points stop at zero and the level is unchanged

### Requirement: Level and progress display
The system SHALL display the current level number and a progress bar showing current stage points as a fraction of the stage target. The system SHALL NOT display per-item statistics or the strand structure during practice.

#### Scenario: Progress shown
- **WHEN** the learner is at level 7 with 14 of 31 points
- **THEN** the display shows "Level 7" and a bar about 45% full

### Requirement: Items answered wrongly are asked more often
Within a stage, the system SHALL choose each question's item at random, weighted so that items the learner has recently answered wrongly are more likely to be chosen and items answered correctly become less likely, while every item in the stage keeps a non-zero chance of being chosen.

#### Scenario: Weak item favoured
- **WHEN** the learner has answered item X wrongly several times and other items correctly
- **THEN** X is selected more often than the other items over subsequent questions

#### Scenario: No item excluded
- **WHEN** the learner has answered an item correctly many times
- **THEN** that item can still be selected

### Requirement: New items are introduced before being tested
When a stage contains items not present in the learner's previous stage of the same strand, the system SHALL first play each new item 2 to 3 times with its name shown, then favour the new items for the first few questions of the stage.

#### Scenario: Stage adds an item
- **WHEN** a stage adds scale degree 4 to a set of 1, 5, 3
- **THEN** before the first question, degree 4 is played 2 to 3 times labelled "4", and it appears with elevated frequency in the first questions

### Requirement: Global instrument dimension
The curriculum SHALL define a level from which questions use randomly chosen instruments instead of piano only. This threshold SHALL apply across all strands.

#### Scenario: Before the threshold
- **WHEN** the learner's level is below the instrument threshold
- **THEN** all questions play on piano

#### Scenario: After the threshold
- **WHEN** the learner's level is at or above the instrument threshold
- **THEN** each question uses an instrument chosen at random from the instruments the learner has not excluded

### Requirement: v1 curriculum content
The v1 curriculum SHALL contain a scale-degree strand and an interval strand, with no prerequisites between them, following the stage tables in design.md. Within each phase, stages SHALL add one item at a time; when a new difficulty dimension is introduced, the item set SHALL restart small and grow by two items per stage, except where design.md specifies otherwise.

#### Scenario: First stages
- **WHEN** a new learner starts
- **THEN** the first stage is the interval strand's tritone vs octave on a fixed root, and the second is the scale-degree strand's 1 vs 5 in a fixed key
