from datetime import datetime, timedelta
from flask import Blueprint, jsonify

from models.waterpoint import WaterPoint, Reading
from services.monitoring import compute_status, compute_priority

waterpoints_bp = Blueprint("waterpoints", __name__)

PRIORITY_ICON = {"HIGH": "🔴", "MEDIUM": "🟠", "LOW": "🟢", "NONE": "🟢"}
STATUS_ICON = {
    "Operational": "🟢",
    "Low Usage": "🟡",
    "Possibly Failed": "🟠",
    "Out of Service": "🔴",
    "Sensor Fault": "⚠️",
    "Data Error": "⚠️",
}


def _build_summary(wp, now=None):
    now = now or datetime.utcnow()
    readings_desc = (
        Reading.query.filter_by(waterpoint_id=wp.waterpoint_id)
        .order_by(Reading.recorded_at.desc())
        .all()
    )
    status_info = compute_status(readings_desc, now=now)
    score, label = compute_priority(status_info, readings_desc)

    latest = readings_desc[0] if readings_desc else None
    avg_usage = None
    valid_usages = [r.usage_count for r in readings_desc if r.usage_count is not None and r.validation_status == "Valid"]
    if valid_usages:
        avg_usage = round(sum(valid_usages) / len(valid_usages), 1)

    return {
        "waterpoint_id": wp.waterpoint_id,
        "habitation": wp.habitation,
        "current_status": status_info["calculated_status"],
        "status_icon": STATUS_ICON.get(status_info["calculated_status"], ""),
        "flow_ok": latest.flow_ok if latest else None,
        "last_working_at": status_info["last_working_at"].isoformat() if status_info["last_working_at"] else None,
        "downtime_hours": status_info["downtime_hours"],
        "downtime_text": status_info["downtime_text"],
        "last_usage": latest.usage_count if latest else None,
        "last_recorded_at": latest.recorded_at.isoformat() if latest else None,
        "sensor_fault": status_info["sensor_fault"],
        "priority_score": score,
        "priority_label": label,
        "priority_icon": PRIORITY_ICON.get(label, ""),
        "average_usage": avg_usage,
        "total_readings": len(readings_desc),
    }


@waterpoints_bp.route("/api/waterpoints", methods=["GET"])
def list_waterpoints():
    wps = WaterPoint.query.order_by(WaterPoint.waterpoint_id.asc()).all()
    summaries = [_build_summary(wp) for wp in wps]
    return jsonify({"success": True, "count": len(summaries), "waterpoints": summaries})


@waterpoints_bp.route("/api/waterpoints/<string:waterpoint_id>", methods=["GET"])
def get_waterpoint(waterpoint_id):
    wp = WaterPoint.query.filter_by(waterpoint_id=waterpoint_id).first()
    if not wp:
        return jsonify({"success": False, "error": "Water point not found"}), 404

    summary = _build_summary(wp)
    readings = (
        Reading.query.filter_by(waterpoint_id=waterpoint_id)
        .order_by(Reading.recorded_at.desc())
        .limit(50)
        .all()
    )
    summary["recent_readings"] = [r.to_dict() for r in readings]
    return jsonify({"success": True, "waterpoint": summary})


@waterpoints_bp.route("/api/priority", methods=["GET"])
def priority_list():
    wps = WaterPoint.query.all()
    summaries = [_build_summary(wp) for wp in wps]

    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2, "NONE": 3}
    summaries.sort(key=lambda s: (order.get(s["priority_label"], 4), -s["priority_score"]))

    failing = [s for s in summaries if s["current_status"] != "Operational"]
    return jsonify({"success": True, "count": len(failing), "waterpoints": failing})


@waterpoints_bp.route("/api/dashboard", methods=["GET"])
def dashboard_summary():
    wps = WaterPoint.query.all()
    summaries = [_build_summary(wp) for wp in wps]

    total = len(summaries)
    operational = sum(1 for s in summaries if s["current_status"] == "Operational")
    out_of_service = sum(1 for s in summaries if s["current_status"] == "Out of Service")
    high_priority = sum(1 for s in summaries if s["priority_label"] == "HIGH")
    sensor_faults = sum(1 for s in summaries if s["sensor_fault"])
    avg_uptime = round((operational / total) * 100, 1) if total else 0.0

    health_counts = {"Operational": 0, "Out of Service": 0, "Low Usage": 0, "Sensor Fault": 0, "Possibly Failed": 0, "Data Error": 0}
    for s in summaries:
        health_counts[s["current_status"]] = health_counts.get(s["current_status"], 0) + 1

    priority_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for s in summaries:
        if s["priority_label"] in priority_counts:
            priority_counts[s["priority_label"]] += 1

    habitation_failures = {}
    for s in summaries:
        if s["current_status"] != "Operational":
            habitation_failures[s["habitation"]] = habitation_failures.get(s["habitation"], 0) + 1

    usage_trend = (
        Reading.query.filter(Reading.usage_count.isnot(None))
        .order_by(Reading.recorded_at.asc())
        .all()
    )
    trend = [{"recorded_at": r.recorded_at.isoformat(), "usage_count": r.usage_count} for r in usage_trend]

    top_priority = None
    ordered = sorted(summaries, key=lambda s: -s["priority_score"])
    if ordered and ordered[0]["priority_score"] > 0:
        top_priority = ordered[0]["waterpoint_id"]

    return jsonify({
        "success": True,
        "cards": {
            "total_waterpoints": total,
            "operational": operational,
            "out_of_service": out_of_service,
            "high_priority_repairs": high_priority,
            "sensor_faults": sensor_faults,
            "average_uptime": avg_uptime,
        },
        "health_chart": health_counts,
        "priority_chart": priority_counts,
        "habitation_chart": habitation_failures,
        "usage_trend": trend,
        "top_priority_waterpoint": top_priority,
    })


@waterpoints_bp.route("/api/health", methods=["GET"])
def system_health():
    total_readings = Reading.query.count()
    total_waterpoints = WaterPoint.query.count()
    return jsonify({
        "success": True,
        "status": "ok",
        "server_time": datetime.utcnow().isoformat(),
        "total_waterpoints": total_waterpoints,
        "total_readings": total_readings,
    })
