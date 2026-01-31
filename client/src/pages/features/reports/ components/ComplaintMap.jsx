import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useState } from "react";

const containerStyle = { width: "100%", height: "100%" };

const icons = {
  FIRE: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
  WATER: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  ELECTRICITY: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  WASTE: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
  INFRASTRUCTURE: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
};

export default function ComplaintMap({ userLocation }) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script", // MUST be same everywhere
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [markers, setMarkers] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (isLoaded) fetchReports();
  }, [isLoaded]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/map-reports`);
      const result = await res.json();

      console.log("RAW API RESPONSE:", result);

      const reports = result.data; // 🔥 FIX

      console.log("REPORTS ARRAY:", reports);

      const grouped = {};

      reports.forEach(r => {
        const lat = parseFloat(r.location?.lat);
        const lng = parseFloat(r.location?.lng);

        if (!lat || !lng) return;

        const key = `${lat.toFixed(4)}_${lng.toFixed(4)}_${r.department}`;

        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({ ...r, lat, lng });
      });

      const markerData = Object.values(grouped).map(group => ({
        lat: group[0].lat,
        lng: group[0].lng,
        department: group[0].department,
        reports: group
      }));

      console.log("MARKERS CREATED:", markerData);

      setMarkers(markerData);

    } catch (err) {
      console.error("MAP LOAD ERROR:", err);
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={userLocation || { lat: 25.4935, lng: 81.8673 }}
      zoom={14}
    >
      {markers.map((m, i) => (
        <Marker
          key={i}
          position={{ lat: m.lat, lng: m.lng }}
          icon={icons[m.department]}
          onClick={() => setSelected(m)}
        />
      ))}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div style={{ maxHeight: 260, overflowY: "auto", width: 260, color: "black" }}>
            <h3>{selected.department} Complaints</h3>

            {selected.reports.map(r => (
              <div key={r.id} style={{ borderBottom: "1px solid #ccc", marginBottom: 8 }}>
                <img src={r.imageUrl} width="100%" alt="report" />
                <b>{r.title}</b>
                <p>{r.description}</p>
                <div>👍 {r.upvotes || 0} | 👎 {r.downvotes || 0}</div>
              </div>
            ))}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
