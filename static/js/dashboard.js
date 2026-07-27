let healthChartInstance, usageTrendChartInstance, priorityChartInstance, habitationChartInstance;

const CARD_DEFS = [
  { key: "total_waterpoints", label: "Total Water Points", icon: "bi-geo-alt", color: "var(--jal-blue)" },
  { key: "operational", label: "Operational", icon: "bi-check-circle", color: "var(--jal-green)" },
  { key: "out_of_service", label: "Out of Service", icon: "bi-x-circle", color: "var(--jal-red)" },
  { key: "high_priority_repairs", label: "High Priority Repairs", icon: "bi-exclamation-triangle", color: "var(--jal-orange)" },
  { key: "sensor_faults", label: "Sensor Faults", icon: "bi-cpu", color: "#8a6d00" },
  { key: "average_uptime", label: "Average Uptime", icon: "bi-speedometer2", color: "var(--jal-teal)", suffix: "%" },
];

function statusClass(status) {
  return "status-" + status.replace(/ /g, "-");
}

function priorityClass(label) {
  return "priority-pill-" + label;
}

async function loadDashboard() {
  document.getElementById("loadingState").classList.remove("d-none");
  document.getElementById("errorState").classList.add("d-none");
  document.getElementById("dashboardContent").classList.add("d-none");

  try {
    const [dashRes, priorityRes] = await Promise.all([
      fetch("/api/dashboard"),
      fetch("/api/priority"),
    ]);
    if (!dashRes.ok || !priorityRes.ok) throw new Error("Network error");

    const dash = await dashRes.json();
    const priority = await priorityRes.json();

    renderCards(dash.cards);
    renderHealthChart(dash.health_chart);
    renderUsageTrendChart(dash.usage_trend);
    renderPriorityChart(dash.priority_chart);
    renderHabitationChart(dash.habitation_chart);
    renderPriorityTable(priority.waterpoints);

    document.getElementById("loadingState").classList.add("d-none");
    document.getElementById("dashboardContent").classList.remove("d-none");
  } catch (err) {
    console.error(err);
    document.getElementById("loadingState").classList.add("d-none");
    document.getElementById("errorState").classList.remove("d-none");
  }
}

function renderCards(cards) {
  const el = document.getElementById("summaryCards");
  el.innerHTML = CARD_DEFS.map(def => {
    const value = cards[def.key] ?? 0;
    return `
      <div class="col-6 col-lg-2">
        <div class="summary-card">
          <div class="icon-box" style="background:${def.color}"><i class="bi ${def.icon}"></i></div>
          <div>
            <div class="value">${value}${def.suffix || ""}</div>
            <div class="label">${def.label}</div>
          </div>
        </div>
      </div>`;
  }).join("");
}

function renderHealthChart(healthChart) {
  const ctx = document.getElementById("healthChart");
  const labels = Object.keys(healthChart).filter(k => healthChart[k] > 0);
  const data = labels.map(l => healthChart[l]);
  const colors = { "Operational": "#2e9e6e", "Out of Service": "#d9534f", "Low Usage": "#e8c547", "Sensor Fault": "#e08e2b", "Possibly Failed": "#e08e2b", "Data Error": "#999" };
  if (healthChartInstance) healthChartInstance.destroy();
  healthChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: labels.map(l => colors[l] || "#ccc") }] },
    options: { plugins: { legend: { position: "bottom" } } },
  });
}

function renderUsageTrendChart(trend) {
  const ctx = document.getElementById("usageTrendChart");
  const labels = trend.map(t => new Date(t.recorded_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit" }));
  const data = trend.map(t => t.usage_count);
  if (usageTrendChartInstance) usageTrendChartInstance.destroy();
  usageTrendChartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ label: "Usage Count", data, borderColor: "#0e8f8a", backgroundColor: "rgba(14,143,138,0.15)", tension: 0.3, fill: true }] },
    options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { maxTicksLimit: 8 } } } },
  });
}

function renderPriorityChart(priorityCounts) {
  const ctx = document.getElementById("priorityChart");
  const labels = ["HIGH", "MEDIUM", "LOW"];
  const data = labels.map(l => priorityCounts[l] || 0);
  if (priorityChartInstance) priorityChartInstance.destroy();
  priorityChartInstance = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets: [{ label: "Water Points", data, backgroundColor: ["#d9534f", "#e08e2b", "#2e9e6e"] }] },
    options: { plugins: { legend: { display: false } } },
  });
}

function renderHabitationChart(habitationChart) {
  const ctx = document.getElementById("habitationChart");
  const labels = Object.keys(habitationChart);
  const data = labels.map(l => habitationChart[l]);
  if (habitationChartInstance) habitationChartInstance.destroy();
  habitationChartInstance = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets: [{ label: "Failed Water Points", data, backgroundColor: "#0b5b7a" }] },
    options: { plugins: { legend: { display: false } }, indexAxis: "y" },
  });
}

function renderPriorityTable(waterpoints) {
  const body = document.getElementById("priorityTableBody");
  const empty = document.getElementById("priorityEmpty");

  if (!waterpoints || waterpoints.length === 0) {
    body.innerHTML = "";
    empty.classList.remove("d-none");
    return;
  }
  empty.classList.add("d-none");

  body.innerHTML = waterpoints.map(wp => `
    <tr>
      <td><span class="status-pill ${priorityClass(wp.priority_label)}">${wp.priority_icon} ${wp.priority_label}</span></td>
      <td><strong>${wp.waterpoint_id}</strong></td>
      <td>${wp.habitation}</td>
      <td><span class="status-pill ${statusClass(wp.current_status)}">${wp.status_icon} ${wp.current_status}</span></td>
      <td>${wp.last_working_at ? new Date(wp.last_working_at).toLocaleString() : "Unknown"}</td>
      <td>${wp.downtime_text}</td>
      <td>${wp.last_usage ?? "—"}</td>
      <td>${wp.sensor_fault ? "⚠️ Fault" : "🟢 Normal"}</td>
      <td><a href="/waterpoints?wp=${wp.waterpoint_id}" class="btn btn-sm btn-outline-primary">View Details</a></td>
    </tr>
  `).join("");
}

async function simulateFailure() {
  await fetch("/api/demo/simulate-failure", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  loadDashboard();
}

async function simulateRecovery() {
  await fetch("/api/demo/simulate-recovery", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  loadDashboard();
}

loadDashboard();
setInterval(loadDashboard, 30000);
