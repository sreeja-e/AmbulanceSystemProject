import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { AMBULANCE_TYPES } from "../constants/ambulanceTypes";

export default function RequestAmbulancePage() {
  const navigate = useNavigate();
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [ambulanceType, setAmbulanceType] = useState("");
  const [error, setError] = useState("");
  const [typeError, setTypeError] = useState("");
  const [loading, setLoading] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setCoords({ lat: c.latitude, lng: c.longitude });
        setError("");
      },
      () => setError("Unable to fetch location. Enter manually.")
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setTypeError("");

    if (!ambulanceType) {
      setTypeError("Please select an ambulance type.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        lat: Number(coords.lat),
        lng: Number(coords.lng),
        ambulanceType,
      };
      const { data } = await api.post("/request/create", payload);
      localStorage.setItem("uas_last_request", data.request.id);
      navigate(`/track/${data.request.id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container form-page">
      <form className="card form-card" onSubmit={submit}>
        <h2>Request Ambulance</h2>
        <button type="button" className="btn secondary" onClick={detectLocation}>
          Use Current Location
        </button>
        <input
          name="lat"
          type="number"
          step="any"
          placeholder="Latitude"
          value={coords.lat}
          onChange={(e) => setCoords((s) => ({ ...s, lat: e.target.value }))}
          required
        />
        <input
          name="lng"
          type="number"
          step="any"
          placeholder="Longitude"
          value={coords.lng}
          onChange={(e) => setCoords((s) => ({ ...s, lng: e.target.value }))}
          required
        />

        <fieldset className="radio-fieldset">
          <legend className="field-label">Ambulance Type</legend>
          <div className="radio-group">
            {AMBULANCE_TYPES.map((type) => (
              <label
                key={type.value}
                className={`radio-option${ambulanceType === type.value ? " selected" : ""}`}
              >
                <input
                  type="radio"
                  name="ambulanceType"
                  value={type.value}
                  checked={ambulanceType === type.value}
                  onChange={(e) => {
                    setAmbulanceType(e.target.value);
                    setTypeError("");
                  }}
                />
                <span>{type.label}</span>
              </label>
            ))}
          </div>
          {typeError && <p className="error">{typeError}</p>}
        </fieldset>

        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={loading}>
          {loading ? "Requesting..." : "Request Now"}
        </button>
      </form>
    </main>
  );
}
