import base64
import json
import os
from io import BytesIO
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from PIL import Image
from pydantic import ValidationError

from .schemas import CourseCodeExtractionResult, CourseImportResult

DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434"
EXTRACTION_PROMPT = """Extract every visible university course row from this screenshot. Return only JSON matching the supplied schema.

This is an Opened Course List table. Extract only these columns: Course Code-Sec.-Lab to courseCode, Course Title to name, and Time to sourceTime. Leave credits, school, instructor, and location null. Copy sourceTime exactly as displayed. The Course Code-Sec.-Lab value is usually immediately to the left of Credit and Course Title. Always read and preserve its full value, including its department prefix, number, section, and lab suffixes; examples include ECO3101-01-00, ECO3134-02-00, and ECO6204-01-00. It is not the nearby major/subject value (for example, ME). A missing courseCode is only acceptable when the code is truly unreadable; add a warning saying that it could not be read. Do not treat administrative columns such as No., Semester, Campus, Major, Grade, Class Session, Similar, Over, Plan, Mile, Class closed, Professor, Lecture room, Language, Distance Lecture Status, Evaluation Methods, or Eligibility as course details.

Read the Time column with this exact grammar. Each day abbreviation starts a new meeting session; commas and slashes can both separate sessions. The periods following a day continue until the next day abbreviation. Consecutive listed periods become one inclusive range. For example, "Tue5,6/Thu4" means Tue periods 5–6 and Thu period 4; "Tue1,Thu2,3" means Tue period 1 and Thu periods 2–3; "Mon9,10/Wed10" means Mon periods 9–10 and Wed period 10. Never carry a period from one day to another. If a single day has non-consecutive periods, use separate meetingBlocks for its separate ranges.

Each course must have a non-empty name and at least one meetingBlocks item. Each meeting block must use one or more of these exact day abbreviations: Mon, Tue, Wed, Thu, Fri, Sat, Sun; startPeriod and endPeriod must be integers from 1 through 10, with endPeriod no earlier than startPeriod. Optional text fields may be strings or null. Preserve readable Korean and English text. Never invent a value: use null and add a warning for ambiguous optional text. Create separate meetingBlocks when a course has different times on different days. Do not include markdown or explanatory prose."""
COURSE_CODE_PROMPT = """This image is a narrow crop of the Course Code-Sec.-Lab column from an Opened Course List. Read one course code for each visible course row, from top to bottom. Return them in the courseCodes array in that same order. Preserve the exact text, including its department prefix, course number, section, and lab suffix (examples: ECO3101-01-00, ECO3134-02-00, ECO6204-01-00). Ignore table headings, action icons, credit values, and all non-code text. Use null only for a row whose code is unreadable. Do not include markdown or prose."""


class ExtractorError(Exception):
    def __init__(self, message: str, details: str | None = None):
        super().__init__(message)
        self.details = details


def extract_courses(image_bytes: bytes, mime_type: str) -> CourseImportResult:
    content = request_model(image_bytes, EXTRACTION_PROMPT, CourseImportResult)
    result = validate_model_response(content, CourseImportResult)
    course_codes = extract_course_codes(image_bytes, len(result.courses))
    course_codes = course_codes or [None] * len(result.courses)
    courses = [
        course.model_copy(update={
            "courseCode": code.strip() if code and not course.courseCode else course.courseCode,
            "credits": None,
            "school": None,
            "instructor": None,
            "location": None,
        })
        for course, code in zip(result.courses, course_codes)
    ]
    return result.model_copy(update={"courses": courses})


def request_model(image_bytes: bytes, prompt: str, response_model: type[CourseImportResult] | type[CourseCodeExtractionResult]) -> str:
    base_url = os.environ.get("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL).rstrip("/")
    model = os.environ.get("OLLAMA_MODEL", "qwen2.5vl:7b")
    payload = {
        "model": model,
        "stream": False,
        # Giving Ollama the generated JSON Schema is substantially more reliable
        # than its generic JSON mode: it can constrain names, days, and periods.
        "format": response_model.model_json_schema(),
        "options": {"temperature": 0},
        "messages": [{"role": "user", "content": prompt, "images": [base64.b64encode(image_bytes).decode("ascii")]}],
    }
    request = Request(
        f"{base_url}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=60) as response:
            body = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        if error.code == 404:
            message = f"The local Ollama model '{model}' is not installed. Run: ollama pull {model}"
        else:
            message = f"Local Ollama returned HTTP {error.code}."
        raise ExtractorError(message) from error
    except (URLError, TimeoutError) as error:
        raise ExtractorError("Local Ollama could not be reached. Start Ollama, then try again.") from error
    try:
        return body["message"]["content"]
    except (KeyError, IndexError, TypeError) as error:
        raise ExtractorError(
            "Ollama returned a response without course content.",
            "The Ollama response did not contain message.content.",
        ) from error

def validate_model_response(content: str, response_model: type[CourseImportResult] | type[CourseCodeExtractionResult]):
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as error:
        raise ExtractorError(
            "The model did not return valid JSON.",
            f"JSON error at character {error.pos}: {error.msg}\n\nModel response:\n{truncate(content)}",
        ) from error

    try:
        return response_model.model_validate(parsed)
    except ValidationError as error:
        raise ExtractorError(
            "The model returned course data that does not match the importer format.",
            validation_details(error, content),
        ) from error


def extract_course_codes(image_bytes: bytes, course_count: int) -> list[str | None] | None:
    """Read small codes in a focused pass; a mismatch is never merged by guesswork."""
    try:
        content = request_model(crop_course_code_column(image_bytes), COURSE_CODE_PROMPT, CourseCodeExtractionResult)
        result = validate_model_response(content, CourseCodeExtractionResult)
    except ExtractorError:
        return None
    return result.courseCodes if len(result.courseCodes) == course_count else None


def crop_course_code_column(image_bytes: bytes) -> bytes:
    """Crop the stable Course Code-Sec.-Lab column from the supplied table view."""
    with Image.open(BytesIO(image_bytes)) as image:
        left = round(image.width * 0.20)
        right = round(image.width * 0.36)
        cropped = image.crop((left, 0, right, image.height)).convert("RGB")
        output = BytesIO()
        cropped.save(output, format="PNG")
    return output.getvalue()


def validation_details(error: ValidationError, content: str) -> str:
    problems = []
    for problem in error.errors(include_url=False):
        path = ".".join(str(part) for part in problem["loc"])
        received = truncate(repr(problem.get("input")), 160)
        problems.append(f"{path}: {problem['msg']} (received {received})")
    return "Validation problems:\n" + "\n".join(f"• {problem}" for problem in problems) + f"\n\nModel response:\n{truncate(content)}"


def truncate(value: str, limit: int = 2_000) -> str:
    return value if len(value) <= limit else f"{value[:limit]}\n… [truncated]"
