import { useEffect, useState } from "react";
import { api } from "../services/api";
import StatusBadge from "../components/StatusBadge";

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("total");
  const totalRequests = requests.length;
  const activeRequests = requests.filter((r) => ["pending", "accepted"].includes(r.status)).length;
  const completedRequests = requests.filter((r) => r.status === "completed").length;
  const filteredRequests = requests.filter((r) => {
    if (selectedFilter === "active") return ["pending", "accepted"].includes(r.status);
    if (selectedFilter === "completed") return r.status === "completed";
    return true;
  });

  const load = async () => {
    const [r, d] = await Promise.all([api.get("/admin/requests"), api.get("/admin/drivers")]);
    setRequests(r.data.requests || []);
    setDrivers(d.data.drivers || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="container page-grid">
      <section className="card">
        <h2>Admin Dashboard</h2>
        <p>
          Drivers: <strong>{drivers.length}</strong>
        </p>
        <div className="stats-grid">
          <button
            className={`stat-card ${selectedFilter === "total" ? "active" : ""}`}
            onClick={() => setSelectedFilter("total")}
            type="button"
          >
            <span className="stat-label">Total Requests</span>
            <strong className="stat-value">{totalRequests}</strong>
          </button>
          <button
            className={`stat-card ${selectedFilter === "active" ? "active" : ""}`}
            onClick={() => setSelectedFilter("active")}
            type="button"
          >
            <span className="stat-label">Active Requests</span>
            <strong className="stat-value">{activeRequests}</strong>
          </button>
          <button
            className={`stat-card ${selectedFilter === "completed" ? "active" : ""}`}
            onClick={() => setSelectedFilter("completed")}
            type="button"
          >
            <span className="stat-label">Completed Requests</span>
            <strong className="stat-value">{completedRequests}</strong>
          </button>
        </div>
      </section>
      <section className="card">
        <h3>
          {selectedFilter === "active"
            ? "Active Requests"
            : selectedFilter === "completed"
            ? "Completed Requests"
            : "All Requests"}
        </h3>
        {filteredRequests.length === 0 ? (
          <p>No requests found for this filter.</p>
        ) : (
          <div className="list">
            {filteredRequests.map((r) => (
              <div className="list-item" key={r.id}>
                <div>
                  <p>
                    <strong>{r.user?.name}</strong> ({r.user?.email})
                  </p>
                  <p>
                    Driver: {r.ambulance?.driver?.name || "Not assigned"} | {r.lat}, {r.lng}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="card">
        <h3>All Drivers & Ambulances</h3>
        <div className="list">
          {drivers.map((d) => (
            <div className="list-item" key={d.id}>
              <div>
                <p>
                  <strong>{d.name}</strong> ({d.email})
                </p>
                <p>
                  Ambulance: {d.ambulance?.id || "N/A"} | Status: {d.ambulance?.status || "N/A"}
                </p>
              </div>
              <span className="role-pill">{d.role}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

