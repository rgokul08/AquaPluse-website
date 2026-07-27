from datetime import datetime
from flask import Blueprint, request, jsonify

from extensions import db
from models.waterpoint import WaterPoint, Reading
from services.validation import validate_reading_payload, ValidationError
from services.monitoring import compute_status, compute_priority, recompute_reading_row

readings_bp = Blueprint("readings", __name__)


def _recompute_waterpoint(waterpoint_id, now=None):
    """Recompute derived fields for ALL readings of a waterpoint after a change."""
    now = now or datetime.utcnow()
    readings_asc = (
        Reading.query.filter_by(waterpoint_id=waterpoint_id)
        .order_by(Reading.recorded_at.asc())
        .all()
    )
    # Recompute status as-of each reading's own timestamp isn't necessary for a
    # prototype; we recompute the *current* derived state using the full
    # newest-first history, then stamp it onto the latest reading. Older
    # readings keep their own validation_status but we still store a
    # calculated_status snapshot for transparency.
    if not readings_asc:
        return None

    readings_desc = list(reversed(readings_asc))
    status_info = compute_status(readings_desc, now=now)
    score, label = compute_priority(status_info, readings_desc)

    latest = readings_desc[0]
    recompute_reading_row(latest, status_info, score)
    db.session.commit()
    return status_info, score, label


@readings_bp.route("/api/readings", methods=["GET"])
def list_readings():
    query = Reading.query

    waterpoint_id = request.args.get("waterpoint_id")
    habitation = request.args.get("habitation")
    status = request.args.get("status")
    flow_status = request.args.get("flow_status")  # "true"/"false"
    valid_only = request.args.get("valid")  # "valid"/"invalid"
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    if waterpoint_id:
        query = query.filter(Reading.waterpoint_id.ilike(f"%{waterpoint_id}%"))
    if habitation:
        query = query.filter(Reading.habitation.ilike(f"%{habitation}%"))
    if status:
        query = query.filter(Reading.calculated_status == status)
    if flow_status in ("true", "false"):
        query = query.filter(Reading.flow_ok == (flow_status == "true"))
    if valid_only == "valid":
        query = query.filter(Reading.validation_status == "Valid")
    elif valid_only == "invalid":
        query = query.filter(Reading.validation_status != "Valid")
    if date_from:
        try:
            query = query.filter(Reading.recorded_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(Reading.recorded_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass

    sort_by = request.args.get("sort_by", "recorded_at")
    order = request.args.get("order", "desc")
    sort_map = {
        "priority": Reading.priority_score,
        "downtime": Reading.downtime_hours,
        "latest": Reading.recorded_at,
        "usage": Reading.usage_count,
        "recorded_at": Reading.recorded_at,
    }
    col = sort_map.get(sort_by, Reading.recorded_at)
    query = query.order_by(col.desc() if order == "desc" else col.asc())

    total_all = Reading.query.count()
    results = query.all()

    return jsonify({
        "success": True,
        "count": len(results),
        "total": total_all,
        "readings": [r.to_dict() for r in results],
    })


@readings_bp.route("/api/readings/<int:reading_id>", methods=["GET"])
def get_reading(reading_id):
    reading = Reading.query.get(reading_id)
    if not reading:
        return jsonify({"success": False, "error": "Reading not found"}), 404
    return jsonify({"success": True, "reading": reading.to_dict()})


@readings_bp.route("/api/readings", methods=["POST"])
def create_reading():
    data = request.get_json(silent=True) or {}

    try:
        cleaned = validate_reading_payload(data)
    except ValidationError as e:
        return jsonify({"success": False, "error": e.message}), e.status_code

    # ensure waterpoint exists (auto-create for prototype convenience)
    wp = WaterPoint.query.filter_by(waterpoint_id=cleaned["waterpoint_id"]).first()
    if not wp:
        wp = WaterPoint(waterpoint_id=cleaned["waterpoint_id"], habitation=cleaned["habitation"])
        db.session.add(wp)
        db.session.flush()

    reading = Reading(
        waterpoint_id=cleaned["waterpoint_id"],
        habitation=cleaned["habitation"],
        flow_ok=cleaned["flow_ok"],
        usage_count=cleaned["usage_count"],
        recorded_at=cleaned["recorded_at"],
        validation_status=cleaned["validation_status"],
    )
    db.session.add(reading)
    db.session.commit()

    status_info, score, label = _recompute_waterpoint(cleaned["waterpoint_id"])

    return jsonify({
        "success": True,
        "message": "Reading saved successfully.",
        "reading": reading.to_dict(),
        "calculated_status": status_info["calculated_status"],
        "priority_label": label,
        "priority_score": score,
        "downtime_text": status_info["downtime_text"],
    }), 201
