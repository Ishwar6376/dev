import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useState, useCallback } from "react";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const center = { lat: 20.5937, lng: 78.9629 }; // India center

const icons = {
  FIRE: "/icons/fire-map-report.png",
  WATER: "/icons/water-map-report.png",
  ELECTRICITY: "/icons/electricity-map-report.png",
  WASTE: "/icons/waste-map-report.png",
  INFRASTRUCTURE: "/icons/infra-map-report.png",
};

export default function AdminComplaintsMap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [markers, setMarkers] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetchReports = useCallback(async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/map-reports`);
    const json = await res.json();
    const reports = json.data || [];

    const markerData = reports
      .map(r => {
        const lat = parseFloat(r.location?.lat);
        const lng = parseFloat(r.location?.lng);
        if (!lat || !lng) return null;
        return { ...r, lat, lng };
      })
      .filter(Boolean);

    setMarkers(markerData);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (!isLoaded) return <div className="text-white p-10">Loading Map...</div>;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* HEADER BAR */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-zinc-900 text-white flex items-center justify-between px-4 z-50">
        <h2 className="font-bold text-sm">📍 City Complaints Overview</h2>
        <button
          onClick={() => window.history.back()}
          className="bg-red-600 px-4 py-1.5 rounded-lg text-xs font-semibold"
        >
          ← Back
        </button>
      </div>

      {/* MAP */}
      <div className="pt-14">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={5}
          options={{ streetViewControl: false }}
        >
          {markers.map((r) => (
            <Marker
              key={r.id}
              position={{ lat: r.lat, lng: r.lng }}
              icon={{
                url: icons[r.department],
                scaledSize: new window.google.maps.Size(35, 35),
              }}
              onClick={() => setSelected(r)}
            />
          ))}

          {selected && (
            <InfoWindow
              position={{ lat: selected.lat, lng: selected.lng }}
              onCloseClick={() => setSelected(null)}
            >
              <div style={{ width: 220 }}>
                <img src={selected.imageUrl} width="100%" />
                <b>{selected.title}</b>
                <p>{selected.description}</p>
                <p style={{ fontSize: 11 }}>{selected.address}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
