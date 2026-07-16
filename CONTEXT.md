# CONTEXT

Glossary of domain terms for the Korea Study Abroad Scheduler. This file defines meaning, not implementation.

## Terms

### Class
A single, self-contained course offering as the user experiences it: one course code, one instructor, one location, one or more meeting blocks, one set of freeform tags. Course and section are **not** modeled separately — if a course has a lecture and a separate recitation with different times, or multiple sections, each is entered as its own independent Class. Relationships between related Classes (e.g. "these are both Econ 101") are informal, expressed only through shared tags or course codes typed by the user, not a formal parent/child structure.

Each Class requires a name and at least one meeting block. Every other field (course code, school, credits, instructor, location, color, tags, notes, link) is optional and can be added or changed later via edit.

### Tag
A freeform label the user types onto a Class (e.g. "Economics", "Korean", "CS"). Tags are the only mechanism for grouping or generalizing Classes — there is no separate department/subject entity. The set of filter options in the Course Bank is derived dynamically from whatever tags exist across all Classes. Selecting multiple tags in the filter bar uses OR logic — a Class matching any one of the selected tags is shown.

### Meeting block
Each Meeting block has one first period, one last period, and at least one meeting day (e.g. periods 1–2 on Mon/Wed/Fri). A Class may have several Meeting blocks when its meeting times differ by day (e.g. Tuesday period 1 and Thursday periods 2–3).

Meeting days and periods are required. The form accepts period numbers 1–10: 1 is 09:00–09:50, 2 is 10:00–10:50, continuing hourly through 10 at 18:00–18:50. Saved blocks use the corresponding clock times for grid layout and conflict detection.

### Conflict
A relationship between two Classes placed on the *same* Schedule: one of their Meeting blocks shares at least one meeting day with another and their times truly overlap (not merely touch at a boundary). Back-to-back Classes (one ending exactly when another starts) are not conflicts. Conflicts are evaluated per-Schedule, independently — a Class pair may conflict on "Option A" but not be relevant at all on "Option B" if only one of them is placed there. Placing a Class that would create a Conflict is always allowed — the app flags it visually rather than blocking the placement.

### Grid axis
The Schedule Grid panel's background time axis: a start time, end time, and row interval (e.g. hourly) that determine the numbered period rows and gridlines shown. The axis is purely a visual/display setting — editing it does not move or resize any Class, since Class placement always renders by actual clock time. The axis is **global**, shared by all Schedules, not configurable per-Schedule.

### Color
A single color manually picked from a palette when creating/editing a Class, used purely for the visual appearance of that Class's block on the Schedule Grid. Color is independent of Tags — there is no enforced or automatic relationship between a Class's color and its tags.

**Deferred to a later version.** In v1, there is no color field or picker — every Class block renders with the same fixed fill (`#FFFCF0`) on a white grid background.

### Placement
A link between one Class and one Schedule (placing that Class onto that Schedule's grid). A Placement is a **live reference** to the Class, not a snapshot — it stores only which Class is on which Schedule, not a copy of the Class's data. Editing a Class in the Course Bank (time, instructor, etc.) is immediately reflected everywhere that Class is placed. Deleting a Class that has active Placements warns the user (naming how many Schedules it's on) and, if confirmed, cascade-removes it from every Schedule.

A Placement carries no day/time of its own. Where a Class renders on the grid is always computed from the Class's own Meeting blocks, never from where the user dropped it. Dragging (or click-to-add) is an "add to this Schedule" trigger, not a position picker — drop location is not read as data.

### Schedule (Schedule Version)
A named, independent arrangement of Class placements (e.g. "Option A", "Option B"), shown as a tab in the Schedule Grid panel. A Class may be placed on any number of Schedules independently, or none. Placing/removing a Class from a Schedule never affects the Class's existence in the Course Bank.

Duplicating a Schedule creates a deep copy of all its Class placements under a new name. At least one Schedule must always exist — the last remaining Schedule cannot be deleted.
