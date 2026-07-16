import time
from collections import defaultdict, deque
from io import BytesIO

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from PIL import Image, UnidentifiedImageError

from .extractor import ExtractorError, extract_courses

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_IMAGES_PER_UPLOAD = 10
REQUEST_WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 8
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
_requests_by_ip: dict[str, deque[float]] = defaultdict(deque)


@require_GET
def health(request):
    return JsonResponse({"status": "ok"})


def is_rate_limited(ip: str) -> bool:
    now = time.monotonic()
    requests = _requests_by_ip[ip]
    while requests and requests[0] <= now - REQUEST_WINDOW_SECONDS:
        requests.popleft()
    if len(requests) >= MAX_REQUESTS_PER_WINDOW:
        return True
    requests.append(now)
    return False


@csrf_exempt
@require_POST
def parse_course_image(request):
    ip = request.META.get("REMOTE_ADDR", "unknown")
    if is_rate_limited(ip):
        return JsonResponse({"error": "Too many import requests. Please wait a minute and try again."}, status=429)
    images = request.FILES.getlist("images") or request.FILES.getlist("image")
    if not images:
        return JsonResponse({"error": "Choose at least one image to import."}, status=400)
    if len(images) > MAX_IMAGES_PER_UPLOAD:
        return JsonResponse({"error": f"Choose no more than {MAX_IMAGES_PER_UPLOAD} images at a time."}, status=400)

    uploads = []
    for image in images:
        if image.content_type not in ALLOWED_MIME_TYPES:
            return JsonResponse({"error": f"{image.name}: use a PNG, JPEG, or WebP image."}, status=400)
        if image.size > MAX_UPLOAD_BYTES:
            return JsonResponse({"error": f"{image.name}: images must be 10 MB or smaller."}, status=400)
        image_bytes = image.read()
        try:
            with Image.open(BytesIO(image_bytes)) as inspected:
                inspected.verify()
        except (UnidentifiedImageError, OSError):
            return JsonResponse({"error": f"{image.name}: the uploaded file is not a valid image."}, status=400)
        uploads.append((image.name, image_bytes, image.content_type))

    courses = []
    for name, image_bytes, mime_type in uploads:
        try:
            result = extract_courses(image_bytes, mime_type)
        except ExtractorError as error:
            response = {"error": f"{name}: {error}"}
            if error.details:
                response["details"] = error.details
            return JsonResponse(response, status=502)
        courses.extend(result.model_dump(mode="json")["courses"])
    return JsonResponse({"courses": courses})
