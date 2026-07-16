from io import BytesIO
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image

from .extractor import ExtractorError
from .schemas import CourseImportResult, parse_source_time


def valid_image() -> SimpleUploadedFile:
    buffer = BytesIO()
    Image.new("RGB", (20, 20), "white").save(buffer, format="PNG")
    return SimpleUploadedFile("courses.png", buffer.getvalue(), content_type="image/png")


class ParseCourseImageTests(TestCase):
    def test_parses_compact_time_sessions_without_combining_days(self):
        self.assertEqual(parse_source_time("Tue5,6/Thu4"), [
            {"days": ["Tue"], "startPeriod": 5, "endPeriod": 6},
            {"days": ["Thu"], "startPeriod": 4, "endPeriod": 4},
        ])

    def test_parses_days_separated_by_commas_or_slashes(self):
        self.assertEqual(parse_source_time("Tue1,Thu2,3"), [
            {"days": ["Tue"], "startPeriod": 1, "endPeriod": 1},
            {"days": ["Thu"], "startPeriod": 2, "endPeriod": 3},
        ])
        self.assertEqual(parse_source_time("Mon9,10/Wed10"), [
            {"days": ["Mon"], "startPeriod": 9, "endPeriod": 10},
            {"days": ["Wed"], "startPeriod": 10, "endPeriod": 10},
        ])

    @patch("imports.views.extract_courses")
    def test_returns_validated_course_candidates(self, extract_courses):
        extract_courses.return_value = CourseImportResult.model_validate({
            "courses": [{
                "courseCode": "ECO3134-02-00",
                "name": "MONEY & BANKING",
                "credits": "3",
                "school": None,
                "instructor": "Park Ki Young",
                "location": "DWHM101",
                "meetingBlocks": [{"days": ["Tue"], "startPeriod": 1, "endPeriod": 1}],
                "warnings": [],
            }]
        })

        response = self.client.post("/api/v1/course-imports/parse", {"image": valid_image()})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["courses"][0]["name"], "MONEY & BANKING")

    @patch("imports.views.extract_courses")
    def test_combines_courses_from_multiple_images(self, extract_courses):
        first = CourseImportResult.model_validate({"courses": [{
            "name": "FIRST COURSE",
            "meetingBlocks": [{"days": ["Mon"], "startPeriod": 1, "endPeriod": 1}],
        }]})
        second = CourseImportResult.model_validate({"courses": [{
            "name": "SECOND COURSE",
            "meetingBlocks": [{"days": ["Tue"], "startPeriod": 2, "endPeriod": 2}],
        }]})
        extract_courses.side_effect = [first, second]

        response = self.client.post("/api/v1/course-imports/parse", {"images": [valid_image(), valid_image()]})

        self.assertEqual(response.status_code, 200)
        self.assertEqual([course["name"] for course in response.json()["courses"]], ["FIRST COURSE", "SECOND COURSE"])

    def test_rejects_non_image_uploads(self):
        upload = SimpleUploadedFile("courses.txt", b"not an image", content_type="text/plain")
        response = self.client.post("/api/v1/course-imports/parse", {"image": upload})
        self.assertEqual(response.status_code, 400)

    @patch("imports.views.extract_courses")
    def test_returns_model_validation_details(self, extract_courses):
        extract_courses.side_effect = ExtractorError(
            "The model returned course data that does not match the importer format.",
            "Validation problems:\n• courses.0.meetingBlocks: Field required",
        )

        response = self.client.post("/api/v1/course-imports/parse", {"image": valid_image()})

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json()["details"], "Validation problems:\n• courses.0.meetingBlocks: Field required")
