import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import StatusBadge from "../components/StatusBadge";
import { formatAmbulanceType } from "../constants/ambulanceTypes";

export default function DriverDashboard() {
  const [requests, setRequests] = useState([]);
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [ambulance, setAmbulance] = useState(null);
  const [message, setMessage] = useState("");
  const [locating, setLocating] = useState(false);

  const activeAccepted = useMemo(() => requests.find((r) => r.status === "accepted"), [requests]);

  const load = async () => {
    const { data } = await api.get("/driver/requests");
    setAmbulance(data.ambulance);
    setRequests(data.requests || []);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const s = getSocket();
    if (!s) return undefined;
    const onNew = ({ request }) => {
      setRequests((prev) => [request, ...prev.filter((p) => p.id !== request.id)]);
      setMessage("New request received.");
    };
    s.on("new_request", onNew);
    return () => s.off("new_request", onNew);
  }, []);

  const decide = async (requestId, action) => {
    await api.post("/driver/accept", { requestId, action });
    setMessage(action === "accept" ? "Request accepted." : "Request rejected.");
    await load();
  };

  const sendLocation = async () => {
    await api.post("/driver/location-update", {
      lat: Number(coords.lat),
      lng: Number(coords.lng),
    });
    setMessage("Location update sent.");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude.toString(), lng: longitude.toString() });
        setMessage("Current location loaded.");
        setLocating(false);
      },
      () => {
        setMessage("Unable to fetch current location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const complete = async (requestId) => {
    await api.post("/driver/complete", { requestId });
    setMessage("Request marked as completed.");
    await load();
  };

  return (
    <main className="container page-grid">
      <section className="card">
        <h2>Driver Dashboard</h2>
        {ambulance && (
          <p>
            Ambulance: <strong>{ambulance.id}</strong> ({ambulance.status})
          </p>
        )}
        {message && <p className="success">{message}</p>}
      </section>

      <section className="card">
        <h3>Incoming Requests</h3>
        {!requests.length ? (
          <p>No requests assigned.</p>
        ) : (
          <div className="list">
            {requests.map((r) => (
              <div className="list-item" key={r.id}>
                <div>
                  <p>
                    <strong>{r.user?.name}</strong> ({r.user?.email})
                  </p>
                  <p>
                    Lat/Lng: {r.lat}, {r.lng}
                  </p>
                  <p>Type: {formatAmbulanceType(r.ambulanceType)}</p>
                  <StatusBadge status={r.status} />
                </div>
                {r.status === "pending" && (
                  <div className="row">
                    <button className="btn small" onClick={() => decide(r.id, "accept")}>
                      Accept
                    </button>
                    <button className="btn small danger" onClick={() => decide(r.id, "reject")}>
                      Reject
                    </button>
                  </div>
                )}
                {r.status === "accepted" && (
                  <button className="btn small" onClick={() => complete(r.id)}>
                    Mark Completed
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h3>Send Live Location</h3>
        <input
          type="number"
          step="any"
          placeholder="Latitude"
          value={coords.lat}
          onChange={(e) => setCoords((s) => ({ ...s, lat: e.target.value }))}
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude"
          value={coords.lng}
          onChange={(e) => setCoords((s) => ({ ...s, lng: e.target.value }))}
        />
        <button className="btn secondary" onClick={useCurrentLocation} disabled={locating}>
          {locating ? "Fetching location..." : "Use Current Location"}
        </button>
        <button className="btn" onClick={sendLocation} disabled={!activeAccepted}>
          Send Update
        </button>
        {!activeAccepted && <p className="muted">Accept a request to start tracking updates.</p>}
      </section>
    </main>
  );
}

