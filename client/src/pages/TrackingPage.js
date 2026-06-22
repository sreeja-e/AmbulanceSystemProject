import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import TrackingMap from "../components/TrackingMap";
import StatusBadge from "../components/StatusBadge";
import { formatAmbulanceType } from "../constants/ambulanceTypes";

export default function TrackingPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState(null);

  useEffect(() => {
    api.get(`/request/${id}`).then(({ data }) => {
      setRequest(data.request);
      if (data.request?.ambulance?.lat && data.request?.ambulance?.lng) {
        setAmbulanceLocation({ lat: data.request.ambulance.lat, lng: data.request.ambulance.lng });
      }
    });
  }, [id]);

  useEffect(() => {
    const s = getSocket();
    if (!s) return undefined;

    const onLocation = (payload) => {
      if (payload.requestId === id) {
        setAmbulanceLocation({ lat: payload.lat, lng: payload.lng });
      }
    };
    const onAccepted = ({ request: req }) => {
      if (req.id === id) setRequest(req);
    };
    const onCompleted = ({ request: req }) => {
      if (req?.id === id) setRequest(req);
    };

    s.on("location_update", onLocation);
    s.on("request_accepted", onAccepted);
    s.on("request_completed", onCompleted);
    return () => {
      s.off("location_update", onLocation);
      s.off("request_accepted", onAccepted);
      s.off("request_completed", onCompleted);
    };
  }, [id]);

  if (!request) return <main className="container">Loading...</main>;

  return (
    <main className="container page-grid">
      <section className="card">
        <h2>Live Tracking</h2>
        <p>
          <strong>Request ID:</strong> {request.id}
        </p>
        <p>
          <strong>Status:</strong> <StatusBadge status={request.status} />
        </p>
        <p>
          <strong>User location:</strong> {request.lat}, {request.lng}
        </p>
        <p>
          <strong>Ambulance Type:</strong> {formatAmbulanceType(request.ambulanceType)}
        </p>
      </section>
      <section className="card">
        <TrackingMap userLocation={{ lat: request.lat, lng: request.lng }} ambulanceLocation={ambulanceLocation} />
      </section>
    </main>
  );
}

