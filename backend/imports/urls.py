from django.urls import path
from .views import health, parse_course_image

urlpatterns = [
    path("health", health, name="health"),
    path("course-imports/parse", parse_course_image, name="parse-course-image"),
]
