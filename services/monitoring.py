"""
Derived monitoring logic for JalSathi.

Computes, for every water point:
 - current calculated_status
 - sensor_fault flag
 - downtime (last_working_at + downtime_hours + human readable string)
 - priority_score + priority_label

All computation happens on the SERVER. The frontend only renders values
returned by the API.
"""
from datetime import datetime

# ---- Configurable thresholds -------------------------------------------------
LOW_USAGE_THRESHOLD = 5          # usage_count below this (but >0) => Low Usage
POSSIBLY_FAILED_HOURS = 24       # no successful flow for this long => Possibly Failed
OUT_OF_SERVICE_HOURS = 48        # no successful flow for this long => Out of Service
STUCK_SENSOR_WINDOW = 5          # number of identical consecutive readings => sensor fault
CONSECUTIVE_FAIL_FOR_OOS = 3     # consecutive flow_ok=False readings => Out of Service


def _is_valid_usage_reading(r):
    """A reading we can trust for 'last working' calculations."""
    return (
        r.flow_ok is True
        and r.usage_count is not None
        and r.validation_status == "Valid"
    )


def detect_stuck_sensor(readings_desc):
    """
    readings_desc: readings ordered newest-first.
    Returns True if the last STUCK_SENSOR_WINDOW valid usage_count values
    are all identical (a "stuck" sensor), distinct from a real water-point failure.
    """
    valid_usages = [
        r.usage_count for r in readings_desc
        if r.usage_count is not None and r.validation_status == "Valid"
    ]
    if len(valid_usages) < STUCK_SENSOR_WINDOW:
        return False
    window = valid_usages[:STUCK_SENSOR_WINDOW]
    return len(set(window)) == 1


def compute_last_working_at(readings_desc):
    for r in readings_desc:
        if _is_valid_usage_reading(r) and r.usage_count > 0:
            return r.recorded_at
    return None


def format_downtime(is_operational, last_working_at, now=None):
    """Returns a safe, human readable string. Never NaN/undefined/null/blank."""
    if is_operational:
        return "Operational"
    if last_working_at is None:
        return "Unknown"

    now = now or datetime.utcnow()
    delta = now - last_working_at
    if delta.total_seconds() < 0:
        return "Unknown"

    days = delta.days
    hours = delta.seconds // 3600
    if days == 0 and hours == 0:
        minutes = (delta.seconds % 3600) // 60
        return f"{minutes} minutes" if minutes > 0 else "Just now"
    parts = []
    if days > 0:
        parts.append(f"{days} day{'s' if days != 1 else ''}")
    if hours > 0:
        parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
    return " ".join(parts) if parts else "Unknown"


def compute_status(readings_desc, now=None):
    """
    readings_desc: readings for one waterpoint, ordered NEWEST FIRST.
    Returns dict with calculated_status, sensor_fault, last_working_at,
    downtime_hours, downtime_text.
    """
    now = now or datetime.utcnow()

    if not readings_desc:
        return {
            "calculated_status": "Data Error",
            "sensor_fault": False,
            "last_working_at": None,
            "downtime_hours": None,
            "downtime_text": "Unknown",
        }

    latest = readings_desc[0]

    # --- Data error: missing or out-of-range/invalid usage_count on the latest reading ---
    data_error = latest.usage_count is None or latest.validation_status == "Invalid"

    # --- Sensor fault: stuck sensor detection takes priority over "failure" ---
    stuck = detect_stuck_sensor(readings_desc)

    last_working_at = compute_last_working_at(readings_desc)

    # --- Consecutive flow_ok=False check for Out of Service -------------------
    consecutive_false = 0
    for r in readings_desc:
        if r.flow_ok is False:
            consecutive_false += 1
        else:
            break

    hours_since_last_working = None
    if last_working_at is not None:
        hours_since_last_working = max(0.0, (now - last_working_at).total_seconds() / 3600.0)

    # --- Decide status (priority order matters) --------------------------------
    if stuck:
        status = "Sensor Fault"
    elif data_error:
        status = "Data Error"
    elif consecutive_false >= CONSECUTIVE_FAIL_FOR_OOS or (
        hours_since_last_working is not None and hours_since_last_working >= OUT_OF_SERVICE_HOURS
    ) or (last_working_at is None and len(readings_desc) > 0):
        status = "Out of Service"
    elif hours_since_last_working is not None and hours_since_last_working >= POSSIBLY_FAILED_HOURS:
        status = "Possibly Failed"
    elif latest.flow_ok is True and latest.usage_count is not None:
        if latest.usage_count == 0:
            status = "Possibly Failed"
        elif latest.usage_count < LOW_USAGE_THRESHOLD:
            status = "Low Usage"
        else:
            status = "Operational"
    else:
        status = "Possibly Failed"

    is_operational = status == "Operational"
    downtime_hours = None if is_operational else hours_since_last_working
    downtime_text = format_downtime(is_operational, last_working_at, now=now)

    return {
        "calculated_status": status,
        "sensor_fault": stuck,
        "last_working_at": last_working_at,
        "downtime_hours": downtime_hours,
        "downtime_text": downtime_text,
    }


def compute_priority(status_info, readings_desc):
    """
    priority_score = downtime_hours * failure_factor
    failure_factor derived from number of recent failed readings + status severity.
    """
    status = status_info["calculated_status"]
    downtime_hours = status_info["downtime_hours"] or 0.0

    severity_weight = {
        "Operational": 0.0,
        "Low Usage": 0.3,
        "Possibly Failed": 1.0,
        "Out of Service": 2.0,
        "Sensor Fault": 1.2,
        "Data Error": 0.8,
    }.get(status, 0.5)

    recent = readings_desc[:10]
    failed_count = sum(1 for r in recent if r.flow_ok is False or (r.usage_count in (None,)) )
    failure_factor = severity_weight * (1 + 0.15 * failed_count)

    score = round(downtime_hours * failure_factor, 2) if downtime_hours else round(failure_factor * 2, 2)

    if status == "Operational":
        score = 0.0

    if score >= 40:
        label = "HIGH"
    elif score >= 12:
        label = "MEDIUM"
    elif score > 0:
        label = "LOW"
    else:
        label = "NONE"

    return score, label


def recompute_reading_row(reading, status_info, score):
    """Persist derived fields onto a Reading row (mutates, does not commit)."""
    reading.calculated_status = status_info["calculated_status"]
    reading.sensor_fault = status_info["sensor_fault"]
    reading.downtime_hours = status_info["downtime_hours"]
    reading.priority_score = score
    return reading
