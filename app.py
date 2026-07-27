import os
import csv
import io
import random
from datetime import datetime, timedelta

from flask import Flask, render_template, jsonify, request, Response

from extensions import db
from models.waterpoint import WaterPoint, Reading
from routes.readings import readings_bp, _recompute_waterpoint
from routes.waterpoints import waterpoints_bp, _build_summary

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(BASE_DIR, 'database.db')}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JSON_SORT_KEYS"] = False

    db.init_app(app)

    app.register_blueprint(readings_bp)
    app.register_blueprint(waterpoints_bp)

    # ---------------------- Page routes (server-rendered shells) ----------------------
    @app.route("/")
    def dashboard():
        return render_template("dashboard.html", active="dashboard")

    @app.route("/waterpoints")
    def waterpoints_page():
        return render_template("waterpoints.html", active="waterpoints")

    @app.route("/readings")
    def readings_page():
        return render_template("readings.html", active="readings")

    @app.route("/add-reading")
    def add_reading_page():
        return render_template("add_reading.html", active="add")

    @app.route("/sensor-monitor")
    def sensor_monitor_page():
        return render_template("sensor_monitor.html", active="sensor")

    @app.route("/reports")
    def reports_page():
        return render_template("reports.html", active="reports")

    @app.route("/settings")
    def settings_page():
        return render_template("settings.html", active="settings")

    # ---------------------------- Demo mode endpoints ----------------------------
    @app.route("/api/demo/simulate-failure", methods=["POST"])
    def simulate_failure():
        body = request.get_json(silent=True) or {}
        waterpoint_id = body.get("waterpoint_id")

        wp = None
        if waterpoint_id:
            wp = WaterPoint.query.filter_by(waterpoint_id=waterpoint_id).first()
        if not wp:
            wp = WaterPoint.query.order_by(db.func.random()).first()
        if not wp:
            return jsonify({"success": False, "error": "No water points exist yet"}), 404

        now = datetime.utcnow()
        for i in range(4):
            r = Reading(
                waterpoint_id=wp.waterpoint_id,
                habitation=wp.habitation,
                flow_ok=False,
                usage_count=0,
                recorded_at=now - timedelta(hours=(3 - i) * 6),
                validation_status="Valid",
            )
            db.session.add(r)
        db.session.commit()
        status_info, score, label = _recompute_waterpoint(wp.waterpoint_id, now=now)

        return jsonify({
            "success": True,
            "message": f"Simulated failure on {wp.waterpoint_id}",
            "waterpoint_id": wp.waterpoint_id,
            "calculated_status": status_info["calculated_status"],
            "priority_label": label,
        })

    @app.route("/api/demo/simulate-recovery", methods=["POST"])
    def simulate_recovery():
        body = request.get_json(silent=True) or {}
        waterpoint_id = body.get("waterpoint_id")

        wp = None
        if waterpoint_id:
            wp = WaterPoint.query.filter_by(waterpoint_id=waterpoint_id).first()
        if not wp:
            # pick a currently-failed waterpoint if possible
            wps = WaterPoint.query.all()
            failing = [w for w in wps if _build_summary(w)["current_status"] != "Operational"]
            wp = failing[0] if failing else (wps[0] if wps else None)
        if not wp:
            return jsonify({"success": False, "error": "No water points exist yet"}), 404

        now = datetime.utcnow()
        r = Reading(
            waterpoint_id=wp.waterpoint_id,
            habitation=wp.habitation,
            flow_ok=True,
            usage_count=random.randint(20, 60),
            recorded_at=now,
            validation_status="Valid",
        )
        db.session.add(r)
        db.session.commit()
        status_info, score, label = _recompute_waterpoint(wp.waterpoint_id, now=now)

        return jsonify({
            "success": True,
            "message": f"Simulated recovery on {wp.waterpoint_id}",
            "waterpoint_id": wp.waterpoint_id,
            "calculated_status": status_info["calculated_status"],
            "priority_label": label,
        })

    # ---------------------------- Sensor monitor (simulated ESP32 status) ----------------------------
    @app.route("/api/sensor/status", methods=["GET"])
    def sensor_status():
        latest = Reading.query.order_by(Reading.recorded_at.desc()).first()
        connected = False
        last_comm = None
        if latest:
            last_comm = latest.recorded_at
            connected = (datetime.utcnow() - latest.recorded_at) < timedelta(hours=6)

        return jsonify({
            "success": True,
            "device_id": "ESP32-JALSATHI-01",
            "connected": connected,
            "last_communication": last_comm.isoformat() if last_comm else None,
            "current_flow": latest.flow_ok if latest else None,
            "current_usage_count": latest.usage_count if latest else None,
            "sensor_health": "Fault" if (latest and latest.sensor_fault) else "Normal",
            "last_uploaded_reading": latest.to_dict() if latest else None,
        })

    # ---------------------------- Reports ----------------------------
    @app.route("/api/reports", methods=["GET"])
    def reports_summary():
        readings = Reading.query.all()
        total = len(readings)
        valid = sum(1 for r in readings if r.validation_status == "Valid")
        invalid = sum(1 for r in readings if r.validation_status in ("Invalid", "Data Error"))
        sensor_faults = sum(1 for r in readings if r.sensor_fault)

        wps = WaterPoint.query.all()
        summaries = [_build_summary(w) for w in wps]
        failed = [s for s in summaries if s["current_status"] not in ("Operational", "Low Usage")]
        downtimes = [s["downtime_hours"] for s in summaries if s["downtime_hours"]]
        avg_downtime_hours = round(sum(downtimes) / len(downtimes), 1) if downtimes else 0

        top = None
        ordered = sorted(summaries, key=lambda s: -s["priority_score"])
        if ordered and ordered[0]["priority_score"] > 0:
            top = ordered[0]["waterpoint_id"]

        return jsonify({
            "success": True,
            "total_readings": total,
            "valid_readings": valid,
            "invalid_readings": invalid,
            "sensor_faults": sensor_faults,
            "failed_waterpoints": len(failed),
            "average_downtime_hours": avg_downtime_hours,
            "highest_priority_waterpoint": top,
        })

    @app.route("/api/reports/export-csv", methods=["GET"])
    def export_csv():
        readings = Reading.query.order_by(Reading.recorded_at.desc()).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "reading_id", "waterpoint_id", "habitation", "flow_ok", "usage_count",
            "recorded_at", "validation_status", "calculated_status", "priority_score",
            "downtime_hours", "sensor_fault",
        ])
        for r in readings:
            writer.writerow([
                r.reading_id, r.waterpoint_id, r.habitation, r.flow_ok, r.usage_count,
                r.recorded_at.isoformat(), r.validation_status, r.calculated_status,
                r.priority_score, r.downtime_hours, r.sensor_fault,
            ])
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment;filename=jalsathi_readings.csv"},
        )

    return app


app = create_app()


def seed_database():
    """Load initial data from data/sample_readings.csv if the DB is empty."""
    csv_path = os.path.join(BASE_DIR, "data", "sample_readings.csv")
    if not os.path.exists(csv_path):
        return

    with app.app_context():
        if Reading.query.count() > 0:
            return

        habitation_by_wp = {}
        rows = []
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)
                habitation_by_wp[row["waterpoint_id"]] = row["habitation"]

        for wp_id, habitation in habitation_by_wp.items():
            db.session.add(WaterPoint(waterpoint_id=wp_id, habitation=habitation))
        db.session.commit()

        from services.validation import validate_usage_count

        for row in rows:
            usage_raw = row.get("usage_count", "")
            usage_count, status = validate_usage_count(usage_raw if usage_raw != "" else None, allow_missing=True)
            flow_ok_raw = row.get("flow_ok", "true").strip().lower()
            flow_ok = flow_ok_raw in ("true", "1", "yes")

            reading = Reading(
                waterpoint_id=row["waterpoint_id"],
                habitation=row["habitation"],
                flow_ok=flow_ok,
                usage_count=usage_count,
                recorded_at=datetime.fromisoformat(row["recorded_at"]),
                validation_status=status,
            )
            db.session.add(reading)
        db.session.commit()

        # Recompute derived state for every waterpoint once all rows are loaded
        for wp_id in habitation_by_wp:
            _recompute_waterpoint(wp_id)


with app.app_context():
    db.create_all()
    seed_database()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
