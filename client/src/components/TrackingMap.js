import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function TrackingMap({ userLocation, ambulanceLocation }) {
  const center = useMemo(() => {
    if (ambulanceLocation?.lat && ambulanceLocation?.lng) return [ambulanceLocation.lat, ambulanceLocation.lng];
    return [userLocation?.lat || 30.0444, userLocation?.lng || 31.2357];
  }, [ambulanceLocation, userLocation]);

  return (
    <div className="map-wrap">
      <MapContainer center={center} zoom={13} style={{ height: "420px", width: "100%", borderRadius: "14px" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation?.lat && userLocation?.lng && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={icon}>
            <Popup>User Location</Popup>
          </Marker>
        )}
        {ambulanceLocation?.lat && ambulanceLocation?.lng && (
          <Marker position={[ambulanceLocation.lat, ambulanceLocation.lng]} icon={icon}>
            <Popup>Ambulance Location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

