import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import StatusBadge from "../components/StatusBadge";
import { formatAmbulanceType } from "../constants/ambulanceTypes";

export default function UserDashboard() {
  const [requestId, setRequestId] = useState(localStorage.getItem("uas_last_request") || "");
  const [request, setRequest] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!requestId) return;
    api
      .get(`/request/${requestId}`)
      .then((r) => setRequest(r.data.request))
      .catch(() => {});
  }, [requestId]);

  useEffect(() => {
    const s = getSocket();
    if (!s) return undefined;

    const onAccepted = ({ request: req }) => {
      setRequest(req);
      setMessage("Your request has been accepted.");
    };
    const onCompleted = ({ request: req, status }) => {
      if (req) setRequest(req);
      setMessage(status === "rejected" ? "Request was rejected." : "Request completed.");
    };

    s.on("request_accepted", onAccepted);
    s.on("request_completed", onCompleted);

    return () => {
      s.off("request_accepted", onAccepted);
      s.off("request_completed", onCompleted);
    };
  }, []);

  return (
    <main className="container page-grid">
      <section className="card">
        <h2>User Dashboard</h2>
        <p>Request an ambulance and track it live once accepted.</p>
        <Link className="btn" to="/request">
          Request Ambulance
        </Link>
      </section>
      <section className="card">
        <h3>Current Request</h3>
        {!request ? (
          <p>No active request. Create one to start.</p>
        ) : (
          <>
            <p>
              <strong>ID:</strong> {request.id}
            </p>
            <p>
              <strong>Status:</strong> <StatusBadge status={request.status} />
            </p>
            <p>
              <strong>Location:</strong> {request.lat}, {request.lng}
            </p>
            <p>
              <strong>Ambulance Type:</strong> {formatAmbulanceType(request.ambulanceType)}
            </p>
            <Link className="btn secondary" to={`/track/${request.id}`}>
              Open Live Tracking
            </Link>
          </>
        )}
        {message && <p className="success">{message}</p>}
      </section>
    </main>
  );
}

