let allWaterpoints = [];
let detailChartInstance;

function statusClass(status) { return "status-" + status.replace(/ /g, "-"); }
function priorityClass(label) { return "priority-pill-" + label; }

async function init() {
  document.getElementById("loadingState").classList.remove("d-none");
  document.getElementById("errorState").classList.add("d-none");
  document.getElementById("listView").classList.add("d-none");
  document.getElementById("detailView").classList.add("d-none");

  try {
    const res = await fetch("/api/waterpoints");
    if (!res.ok) throw new Error("network");
    const data = await res.json();
    allWaterpoints = data.waterpoints || [];
    document.getElementById("loadingState").classList.add("d-none");

    const params = new URLSearchParams(window.location.search);
    const wp = params.get("wp");
    if (wp) {
      showDetail(wp);
    } else {
      showList();
    }
  } catch (err) {
    console.error(err);
    document.getElementById("loadingState").classList.add("d-none");
    document.getElementById("errorState").classList.remove("d-none");
  }
}

function renderCards(list) {
  const grid = document.getElementById("cardsGrid");
  const empty = document.getElementById("emptyState");
  if (!list.length) {
    grid.innerHTML = "";
    empty.classList.remove("d-none");
    return;
  }
  empty.classList.add("d-none");
  grid.innerHTML = list.map(wp => `
    <div class="col-md-4 col-lg-3">
      <div class="panel-card h-100">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <strong>${wp.waterpoint_id}</strong>
          <span class="status-pill ${priorityClass(wp.priority_label)}">${wp.priority_icon} ${wp.priority_label}</span>
        </div>
        <div class="text-muted small mb-2">${wp.habitation}</div>
        <div class="mb-2"><span class="status-pill ${statusClass(wp.current_status)}">${wp.status_icon} ${wp.current_status}</span></div>
        <div class="small text-muted mb-1">Downtime: ${wp.downtime_text}</div>
        <div class="small text-muted mb-3">Last usage: ${wp.last_usage ?? "—"}</div>
        <button class="btn btn-sm btn-outline-primary w-100" onclick="showDetail('${wp.waterpoint_id}')">View Details</button>
      </div>
    </div>
  `).join("");
}

function showList() {
  history.replaceState(null, "", "/waterpoints");
  document.getElementById("detailView").classList.add("d-none");
  document.getElementById("listView").classList.remove("d-none");
  renderCards(allWaterpoints);
}

document.addEventListener("input", (e) => {
  if (e.target.id === "searchBox") {
    const q = e.target.value.toLowerCase();
    const filtered = allWaterpoints.filter(wp =>
      wp.waterpoint_id.toLowerCase().includes(q) || wp.habitation.toLowerCase().includes(q)
    );
    renderCards(filtered);
  }
});

async function showDetail(waterpointId) {
  document.getElementById("listView").classList.add("d-none");
  document.getElementById("detailView").classList.remove("d-none");
  document.getElementById("detailContent").innerHTML = `<div class="state-box"><i class="bi bi-arrow-repeat"></i>Loading water-point data...</div>`;
  history.replaceState(null, "", `/waterpoints?wp=${waterpointId}`);

  try {
    const res = await fetch(`/api/waterpoints/${waterpointId}`);
    if (!res.ok) throw new Error("network");
    const data = await res.json();
    renderDetail(data.waterpoint);
  } catch (err) {
    document.getElementById("detailContent").innerHTML = `<div class="state-box"><i class="bi bi-wifi-off"></i>Unable to load data. Please try again.</div>`;
  }
}

function renderDetail(wp) {
  const readings = wp.recent_readings || [];

  document.getElementById("detailContent").innerHTML = `
    <div class="row g-3 mb-3">
      <div class="col-lg-8">
        <div class="panel-card">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 class="mb-0">${wp.waterpoint_id} <span class="status-pill ${statusClass(wp.current_status)}">${wp.status_icon} ${wp.current_status}</span></h4>
              <div class="text-muted">${wp.habitation}</div>
            </div>
            <span class="status-pill ${priorityClass(wp.priority_label)} fs-6">${wp.priority_icon} ${wp.priority_label} PRIORITY</span>
          </div>
          <div class="row g-2 small">
            <div class="col-6 col-md-4"><div class="text-muted">Flow Status</div><div class="fw-bold">${wp.flow_ok === true ? "OK" : wp.flow_ok === false ? "Failed" : "—"}</div></div>
            <div class="col-6 col-md-4"><div class="text-muted">Last Working</div><div class="fw-bold">${wp.last_working_at ? new Date(wp.last_working_at).toLocaleString() : "Unknown"}</div></div>
            <div class="col-6 col-md-4"><div class="text-muted">Downtime</div><div class="fw-bold">${wp.downtime_text}</div></div>
            <div class="col-6 col-md-4"><div class="text-muted">Total Usage Count</div><div class="fw-bold">${wp.total_readings}</div></div>
            <div class="col-6 col-md-4"><div class="text-muted">Average Usage</div><div class="fw-bold">${wp.average_usage ?? "Unknown"}</div></div>
            <div class="col-6 col-md-4"><div class="text-muted">Sensor Health</div><div class="fw-bold">${wp.sensor_fault ? "⚠️ Fault" : "🟢 Normal"}</div></div>
            <div class="col-6 col-md-4"><div class="text-muted">Priority Score</div><div class="fw-bold">${wp.priority_score}</div></div>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="chart-card">
          <h6>Usage History</h6>
          <canvas id="detailChart" height="180"></canvas>
        </div>
      </div>
    </div>

    <div class="panel-card">
      <h6>Recent Readings Timeline</h6>
      <div id="timeline">
        ${readings.length ? readings.map(r => `
          <div class="d-flex justify-content-between border-bottom py-2 small">
            <span>${new Date(r.recorded_at).toLocaleString()}</span>
            <span>${r.flow_ok ? "Flow OK" : "Flow Failed"}</span>
            <span>${r.usage_count !== null ? "Usage " + r.usage_count : "—"}</span>
            <span class="status-pill ${statusClass(r.calculated_status || 'Data-Error')}">${r.validation_status}</span>
          </div>
        `).join("") : `<div class="state-box"><i class="bi bi-inbox"></i>No water-point readings found.</div>`}
      </div>
    </div>
  `;

  const ctx = document.getElementById("detailChart");
  if (ctx) {
    const ordered = [...readings].reverse();
    if (detailChartInstance) detailChartInstance.destroy();
    detailChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: ordered.map(r => new Date(r.recorded_at).toLocaleDateString()),
        datasets: [{ label: "Usage", data: ordered.map(r => r.usage_count), borderColor: "#0e8f8a", tension: 0.3 }],
      },
      options: { plugins: { legend: { display: false } } },
    });
  }
}

init();
