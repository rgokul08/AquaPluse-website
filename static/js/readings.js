function statusClass(status) { return "status-" + (status || "Data Error").replace(/ /g, "-"); }

async function applyFilters() {
  document.getElementById("loadingState").classList.remove("d-none");
  document.getElementById("errorState").classList.add("d-none");
  document.getElementById("resultsWrap").classList.add("d-none");

  const params = new URLSearchParams();
  const waterpoint_id = document.getElementById("fWaterpoint").value.trim();
  const habitation = document.getElementById("fHabitation").value.trim();
  const status = document.getElementById("fStatus").value;
  const flow_status = document.getElementById("fFlow").value;
  const valid = document.getElementById("fValid").value;
  const sort_by = document.getElementById("fSort").value;

  if (waterpoint_id) params.set("waterpoint_id", waterpoint_id);
  if (habitation) params.set("habitation", habitation);
  if (status) params.set("status", status);
  if (flow_status) params.set("flow_status", flow_status);
  if (valid) params.set("valid", valid);
  params.set("sort_by", sort_by);

  try {
    const res = await fetch(`/api/readings?${params.toString()}`);
    if (!res.ok) throw new Error("network");
    const data = await res.json();
    document.getElementById("loadingState").classList.add("d-none");
    document.getElementById("resultsWrap").classList.remove("d-none");
    document.getElementById("countLabel").textContent = `Showing ${data.count} of ${data.total} records`;
    renderTable(data.readings);
  } catch (err) {
    console.error(err);
    document.getElementById("loadingState").classList.add("d-none");
    document.getElementById("errorState").classList.remove("d-none");
  }
}

function renderTable(readings) {
  const body = document.getElementById("readingsBody");
  const empty = document.getElementById("emptyState");
  if (!readings.length) {
    body.innerHTML = "";
    empty.classList.remove("d-none");
    return;
  }
  empty.classList.add("d-none");
  body.innerHTML = readings.map(r => `
    <tr>
      <td><strong>${r.waterpoint_id}</strong></td>
      <td>${r.habitation}</td>
      <td>${r.flow_ok ? "OK" : "Failed"}</td>
      <td>${r.usage_count !== null ? r.usage_count : "—"}</td>
      <td>${new Date(r.recorded_at).toLocaleString()}</td>
      <td>${r.validation_status}</td>
      <td><span class="status-pill ${statusClass(r.calculated_status)}">${r.calculated_status}</span></td>
      <td>${r.priority_score ?? 0}</td>
    </tr>
  `).join("");
}

function resetFilters() {
  ["fWaterpoint", "fHabitation"].forEach(id => document.getElementById(id).value = "");
  ["fStatus", "fFlow", "fValid"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("fSort").value = "recorded_at";
  applyFilters();
}

applyFilters();
