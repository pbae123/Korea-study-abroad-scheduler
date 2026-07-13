# 0001: Placements are live references to Classes, not snapshots

## Status
Accepted

## Context
A Class can be placed on multiple Schedules independently. When a Class already placed on one or more Schedules is later edited in the Course Bank (e.g. its time or instructor changes), the app needs a single, unambiguous rule for what happens to those existing Placements. Two options were considered:

- **Live reference**: a Placement stores only a link to the Class by ID. The Schedule always displays the Class's current data. Editing the Class updates it everywhere at once.
- **Snapshot copy**: a Placement freezes a copy of the Class's fields at the moment it was placed. Editing the Class later does not affect Schedules that already used it.

## Decision
Placements are live references. Editing a Class's details in the Course Bank immediately updates every Schedule where it's placed. As a direct consequence, deleting a Class that has active Placements cannot silently orphan those references — the delete flow warns the user how many Schedules the Class is on, and on confirmation cascade-removes it from all of them.

## Consequences
- Single source of truth for Class data; no risk of stale/duplicated fields drifting between the bank and old schedules.
- Simpler data model and storage (no need to version or diff Class snapshots).
- Trade-off: a user cannot "lock in" a schedule's view of a class as of a certain date — correcting a typo in one Class's location will retroactively change how it displays on every Schedule that uses it, including ones the user may have considered "finalized."
- Deletion is destructive across Schedules by design; the confirmation warning is the only safeguard, and there is no undo.
