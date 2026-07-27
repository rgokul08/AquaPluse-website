async function pollSensor() {
  try {
    const res = await fetch("/api/sensor/status");
    const data = await res.json();

    document.getElementById("deviceId").textContent = data.device_id;
    document.getElementById("lastComm").textContent = data.last_communication
      ? new Date(data.last_communication).toLocaleString() : "Unknown";
    document.getElementById("currentFlow").textContent = data.current_flow === true ? "OK" : data.current_flow === false ? "Failed" : "—";
    document.getElementById("currentUsage").textContent = data.current_usage_count ?? "—";
    document.getElementById("sensorHealth").textContent = data.sensor_health === "Fault" ? "⚠️ Fault (Possible Stuck Reading)" : "🟢 Normal";

    const indicator = document.getElementById("connIndicator");
    if (data.connected) {
      indicator.className = "status-pill status-Operational";
      indicator.textContent = "🟢 ESP32 Connected";
    } else {
      indicator.className = "status-pill status-Out-of-Service";
      indicator.textContent = "🔴 ESP32 Offline — Monitoring Locally";
    }

    document.getElementById("lastReading").textContent = data.last_uploaded_reading
      ? JSON.stringify(data.last_uploaded_reading, null, 2)
      : "No readings received yet.";
  } catch (err) {
    document.getElementById("connIndicator").className = "status-pill status-Out-of-Service";
    document.getElementById("connIndicator").textContent = "🔴 ESP32 Offline — Monitoring Locally";
  }
}

pollSensor();
setInterval(pollSensor, 5000);
