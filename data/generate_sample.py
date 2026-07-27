"""One-off helper used to generate data/sample_readings.csv. Not required at runtime."""
import csv
from datetime import datetime, timedelta

BASE = datetime.utcnow()

waterpoints = {
    "WP001": "Anna Nagar",
    "WP002": "Gandhi Street",
    "WP003": "Perumal Koil Street",
    "WP004": "East Colony",
    "WP005": "West Colony",
    "WP006": "Anna Nagar",
    "WP007": "Gandhi Street",
    "WP008": "Perumal Koil Street",
    "WP009": "East Colony",
    "WP010": "West Colony",
    "WP011": "Anna Nagar",
    "WP012": "East Colony",
    "WP013": "Gandhi Street",
    "WP018": "Anna Nagar",
    "WP020": "West Colony",
}

rows = []

def add(wp, hrs_ago, flow_ok, usage):
    rows.append({
        "waterpoint_id": wp,
        "habitation": waterpoints[wp],
        "flow_ok": str(flow_ok).lower(),
        "usage_count": "" if usage is None else usage,
        "recorded_at": (BASE - timedelta(hours=hrs_ago)).isoformat(),
    })

# --- Normal healthy waterpoints (WP001-WP005), several readings each ---
for wp in ["WP001", "WP002", "WP003", "WP004", "WP005"]:
    for i, hrs in enumerate([0, 6, 12, 18]):
        usage = 20 + (i * 5) + (ord(wp[-1]) % 7)
        add(wp, hrs, True, usage)

# --- WP006: low usage water point ---
add("WP006", 0, True, 2)
add("WP006", 6, True, 3)
add("WP006", 12, True, 1)

# --- WP007: missing usage_count (Data Error) ---
add("WP007", 0, True, None)
add("WP007", 6, True, 22)
add("WP007", 12, True, 19)

# --- WP008: some flow_ok = false but recovered (possibly failed briefly) ---
add("WP008", 0, True, 15)
add("WP008", 30, False, 0)
add("WP008", 36, False, 0)

# --- WP009: another normal, multiple readings same wp ---
add("WP009", 0, True, 45)
add("WP009", 6, True, 40)
add("WP009", 24, True, 38)

# --- WP010: out of service, no flow for a long time ---
add("WP010", 0, False, 0)
add("WP010", 6, False, 0)
add("WP010", 12, False, 0)
add("WP010", 60, True, 30)

# --- WP011: normal with varying usage across the day ---
add("WP011", 0, True, 33)
add("WP011", 12, True, 28)

# --- WP012: extremely high usage_count outside plausible range ---
add("WP012", 0, True, 9999)
add("WP012", 20, False, 0)
add("WP012", 26, False, 0)
add("WP012", 32, False, 0)

# --- WP013: recently failed, minor issue (low priority) ---
add("WP013", 0, False, 0)
add("WP013", 3, True, 12)

# --- WP018: stuck sensor - identical usage_count repeated many times ---
for hrs in [0, 4, 8, 12, 16, 20]:
    add("WP018", hrs, True, 25)

# --- WP020: mixed data, additional habitation coverage ---
add("WP020", 0, True, 8)
add("WP020", 10, True, 0)
add("WP020", 20, True, 60)

with open("sample_readings.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["waterpoint_id", "habitation", "flow_ok", "usage_count", "recorded_at"])
    writer.writeheader()
    for r in rows:
        writer.writerow(r)

print(f"Wrote {len(rows)} rows")
