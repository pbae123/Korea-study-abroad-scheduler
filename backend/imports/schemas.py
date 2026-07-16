import re
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

VALID_DAYS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
VALID_DAY_SET = set(VALID_DAYS)
Day = Literal["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
TIME_SESSION = re.compile(r"(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*([0-9]+(?:\s*,\s*[0-9]+)*)")


class ImportedMeetingBlock(BaseModel):
    days: list[Day] = Field(min_length=1)
    startPeriod: int = Field(ge=1, le=10)
    endPeriod: int = Field(ge=1, le=10)

    @field_validator("days")
    @classmethod
    def validate_days(cls, days: list[Day]) -> list[Day]:
        if any(day not in VALID_DAY_SET for day in days):
            raise ValueError("Meeting days must use the app's day abbreviations.")
        return list(dict.fromkeys(days))

    @field_validator("endPeriod")
    @classmethod
    def validate_period_order(cls, end_period: int, info) -> int:
        start_period = info.data.get("startPeriod")
        if start_period is not None and end_period < start_period:
            raise ValueError("endPeriod must be at least startPeriod.")
        return end_period


class ImportedCourse(BaseModel):
    courseCode: Optional[str] = None
    name: str = Field(min_length=1)
    credits: Optional[str] = None
    school: Optional[str] = None
    instructor: Optional[str] = None
    location: Optional[str] = None
    # Kept only while importing. When its compact Yonsei notation is recognized,
    # it is converted deterministically to meetingBlocks below.
    sourceTime: Optional[str] = None
    meetingBlocks: list[ImportedMeetingBlock] = Field(min_length=1)
    warnings: list[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def derive_meeting_blocks_from_source_time(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        source_time = value.get("sourceTime")
        if not isinstance(source_time, str):
            return value
        meeting_blocks = parse_source_time(source_time)
        if meeting_blocks is None:
            return value
        normalized = dict(value)
        normalized["meetingBlocks"] = meeting_blocks
        return normalized


class CourseImportResult(BaseModel):
    courses: list[ImportedCourse]


class CourseCodeExtractionResult(BaseModel):
    # Codes are positional: item N belongs to visible course row N.
    courseCodes: list[Optional[str]]


class TimeExtractionResult(BaseModel):
    # Times are positional: item N belongs to visible course row N.
    sourceTimes: list[Optional[str]]


def parse_source_time(source_time: str) -> list[dict[str, Any]] | None:
    """Parse compact Yonsei Time cells such as ``Tue5,6/Thu4`` without model inference."""
    matches = list(TIME_SESSION.finditer(source_time))
    if not matches:
        return None

    # The only allowed text between day/period groups is a comma, slash, or
    # whitespace. This accepts both Tue5,6/Thu4 and Tue1,Thu2,3.
    cursor = 0
    periods_by_day: dict[str, set[int]] = {}
    for match in matches:
        if not re.fullmatch(r"[\s,/]*", source_time[cursor:match.start()]):
            return None
        day, raw_periods = match.groups()
        periods = [int(period.strip()) for period in raw_periods.split(",")]
        if any(period < 1 or period > 10 for period in periods):
            return None
        periods_by_day.setdefault(day, set()).update(periods)
        cursor = match.end()
    if not re.fullmatch(r"[\s,/]*", source_time[cursor:]):
        return None

    meeting_blocks: list[dict[str, Any]] = []
    for day in VALID_DAYS:
        periods = sorted(periods_by_day.get(day, set()))
        if not periods:
            continue
        range_start = range_end = periods[0]
        for period in periods[1:]:
            if period == range_end + 1:
                range_end = period
                continue
            meeting_blocks.append({"days": [day], "startPeriod": range_start, "endPeriod": range_end})
            range_start = range_end = period
        meeting_blocks.append({"days": [day], "startPeriod": range_start, "endPeriod": range_end})
    return meeting_blocks
