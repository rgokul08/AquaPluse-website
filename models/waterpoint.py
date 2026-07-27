from datetime import datetime
from extensions import db


class WaterPoint(db.Model):
    __tablename__ = "water_points"

    id = db.Column(db.Integer, primary_key=True)
    waterpoint_id = db.Column(db.String(10), unique=True, nullable=False, index=True)
    habitation = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    readings = db.relationship(
        "Reading", backref="waterpoint", lazy="dynamic",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "waterpoint_id": self.waterpoint_id,
            "habitation": self.habitation,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Reading(db.Model):
    __tablename__ = "readings"

    reading_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    waterpoint_id = db.Column(
        db.String(10), db.ForeignKey("water_points.waterpoint_id"), nullable=False, index=True
    )
    habitation = db.Column(db.String(120), nullable=False)
    flow_ok = db.Column(db.Boolean, nullable=True)
    usage_count = db.Column(db.Integer, nullable=True)
    recorded_at = db.Column(db.DateTime, nullable=False)

    # derived / server-computed fields
    validation_status = db.Column(db.String(20), default="Valid")   # Valid/Suspicious/Invalid/Sensor Fault
    calculated_status = db.Column(db.String(30), default="Operational")
    priority_score = db.Column(db.Float, default=0.0)
    downtime_hours = db.Column(db.Float, nullable=True)
    sensor_fault = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "reading_id": self.reading_id,
            "waterpoint_id": self.waterpoint_id,
            "habitation": self.habitation,
            "flow_ok": self.flow_ok,
            "usage_count": self.usage_count,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
            "validation_status": self.validation_status,
            "calculated_status": self.calculated_status,
            "priority_score": self.priority_score,
            "downtime_hours": self.downtime_hours,
            "sensor_fault": self.sensor_fault,
        }
