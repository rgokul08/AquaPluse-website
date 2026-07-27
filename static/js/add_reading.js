function statusClass(status) { return "status-" + (status || "Data Error").replace(/ /g, "-"); }

// default recorded_at to "now"
document.getElementById("recorded_at").value = new Date().toISOString().slice(0, 16);

document.getElementById("readingForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const waterpoint_id = document.getElementById("waterpoint_id").value.trim();
  const habitation = document.getElementById("habitation").value.trim();
  const flow_ok = document.getElementById("flow_ok").value === "true";
  const usageRaw = document.getElementById("usage_count").value;
  const recorded_at = document.getElementById("recorded_at").value;

  // ---- basic frontend validation (backend re-validates everything) ----
  if (!/^WP\d{3}$/.test(waterpoint_id)) {
    return showResult(false, "waterpoint_id must match format WP followed by 3 digits");
  }
  if (!habitation) return showResult(false, "habitation is required");
  if (!recorded_at) return showResult(false, "recorded_at is required");

  const payload = {
    waterpoint_id,
    habitation,
    flow_ok,
    usage_count: usageRaw === "" ? null : Number(usageRaw),
    recorded_at: new Date(recorded_at).toISOString(),
  };

  try {
    const res = await fetch("/api/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      return showResult(false, data.error || "Unable to save reading. Please try again.");
    }

    showResult(true, data.message, data);
  } catch (err) {
    showResult(false, "Unable to load data. Please try again.");
  }
});

function showResult(success, message, data) {
  const box = document.getElementById("resultBox");
  box.classList.remove("d-none");
  if (!success) {
    box.innerHTML = `<div class="alert alert-danger mb-0"><i class="bi bi-x-circle"></i> ${message}</div>`;
    return;
  }
  box.innerHTML = `
    <div class="alert alert-success mb-3"><i class="bi bi-check-circle"></i> ${message}</div>
    <div class="panel-card">
      <div class="row g-2 small">
        <div class="col-6"><div class="text-muted">Water Point ID</div><div class="fw-bold">${data.reading.waterpoint_id}</div></div>
        <div class="col-6"><div class="text-muted">Flow Status</div><div class="fw-bold">${data.reading.flow_ok ? "OK" : "Failed"}</div></div>
        <div class="col-6"><div class="text-muted">Usage Count</div><div class="fw-bold">${data.reading.usage_count ?? "—"}</div></div>
        <div class="col-6"><div class="text-muted">Calculated Status</div><div class="fw-bold"><span class="status-pill ${statusClass(data.calculated_status)}">${data.calculated_status}</span></div></div>
        <div class="col-6"><div class="text-muted">Priority</div><div class="fw-bold">${data.priority_label} (${data.priority_score})</div></div>
        <div class="col-6"><div class="text-muted">Downtime</div><div class="fw-bold">${data.downtime_text}</div></div>
      </div>
    </div>
  `;
}
