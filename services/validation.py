"""
Server-side validation for incoming water-point readings.
Never trust frontend validation alone.
"""
import re
from datetime import datetime

WATERPOINT_ID_PATTERN = re.compile(r"^WP\d{3}$")
USAGE_MIN = 0
USAGE_MAX = 500


class ValidationError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def validate_waterpoint_id(value):
    if value is None or str(value).strip() == "":
        raise ValidationError("waterpoint_id is required")
    if not WATERPOINT_ID_PATTERN.match(str(value).strip()):
        raise ValidationError("waterpoint_id must match format WP followed by 3 digits (e.g. WP001)")
    return str(value).strip()


def validate_habitation(value):
    if value is None or str(value).strip() == "":
        raise ValidationError("habitation is required")
    return str(value).strip()


def validate_flow_ok(value):
    if value is None:
        raise ValidationError("flow_ok is required")
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        if value.lower() in ("true", "1", "yes"):
            return True
        if value.lower() in ("false", "0", "no"):
            return False
    raise ValidationError("flow_ok must be a Boolean")


def validate_recorded_at(value):
    if value is None or str(value).strip() == "":
        raise ValidationError("recorded_at is required")
    try:
        # Accept ISO 8601, tolerate 'Z'
        text = str(value).strip().replace("Z", "+00:00")
        return datetime.fromisoformat(text)
    except Exception:
        raise ValidationError("recorded_at must be a valid ISO 8601 datetime")


def validate_usage_count(value, allow_missing=False):
    """
    Returns (usage_count_or_None, validation_status)
    validation_status one of: Valid, Suspicious, Invalid, Data Error
    """
    if value is None or str(value).strip() == "":
        if allow_missing:
            return None, "Data Error"
        raise ValidationError("usage_count is required")

    try:
        usage = int(float(value))
    except (ValueError, TypeError):
        raise ValidationError("usage_count must be numeric")

    if usage < USAGE_MIN:
        return usage, "Invalid"
    if usage > USAGE_MAX:
        return usage, "Invalid"
    return usage, "Valid"


def validate_reading_payload(data):
    """
    Validates a full incoming reading dict.
    Raises ValidationError on hard failures (missing required non-usage fields).
    usage_count issues are captured as validation_status rather than raising,
    per spec: "usage_count required unless the reading is explicitly marked invalid".
    Returns a cleaned dict + validation_status.
    """
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object")

    waterpoint_id = validate_waterpoint_id(data.get("waterpoint_id"))
    habitation = validate_habitation(data.get("habitation"))
    flow_ok = validate_flow_ok(data.get("flow_ok"))
    recorded_at = validate_recorded_at(data.get("recorded_at"))

    usage_count, status = validate_usage_count(data.get("usage_count"), allow_missing=True)

    return {
        "waterpoint_id": waterpoint_id,
        "habitation": habitation,
        "flow_ok": flow_ok,
        "recorded_at": recorded_at,
        "usage_count": usage_count,
        "validation_status": status,
    }
