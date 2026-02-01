import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

// 1. Define static objects OUTSIDE the component to prevent re-renders
const center = { lat: 20.5937, lng: 78.9629 };
const containerStyle = { width: "100%", height: "100vh" };

// Department Icons mapping
const icons = {
  FIRE: "/icons/fire-map-report.png",
  WATER: "/icons/water-map-report.png",
  ELECTRICITY: "/icons/electricity-map-report.png",
  WASTE: "/icons/waste-map-report.png",
  INFRASTRUCTURE: "/icons/infra-map-report.png",
};

// Clean map options
const mapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  zoomControl: false, 
};

// Standard Hook for loading Maps
export const useGoogleMaps = () =>
  useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"], 
  });

export default function DepartmentComplaintMap() {
  const { department } = useParams();
  const { isLoaded } = useGoogleMaps();

  const [markers, setMarkers] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!department) return;

    const fetchReports = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/department-map/${department}`);
        const json = await res.json();

        const markerData = (json.data || [])
          .map(r => {
            const lat = parseFloat(r.location?.lat);
            const lng = parseFloat(r.location?.lng);
            if (isNaN(lat) || isNaN(lng)) return null;
            return { ...r, lat, lng };
          })
          .filter(Boolean);

        setMarkers(markerData);
      } catch (err) {
        console.error("Fetch Error:", err);
      }
    };

    fetchReports();
  }, [department]);

  // Calculate specific department total
  const totalInDepartment = useMemo(() => markers.length, [markers]);

  if (!isLoaded) return <div className="h-screen w-full bg-zinc-100 flex items-center justify-center animate-pulse text-gray-400 font-medium">Loading Map Data...</div>;

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      
      {/* --- FLOATING DEPARTMENT CARD (Top Left) --- */}
      <div className="absolute top-6 left-6 z-50 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 rounded-2xl pointer-events-auto flex items-center gap-4 min-w-[260px]">
           <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center shadow-inner border border-gray-100 p-2">
              <img 
                src={icons[department] || "/icons/default-map-report.png"} 
                className="w-full h-full object-contain" 
                alt="icon" 
              />
           </div>
           
           <div>
              <h1 className="text-gray-900 font-black text-lg leading-tight tracking-tight capitalize">
                {department?.toLowerCase()} Feed
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Monitoring</p>
              </div>
           </div>

           <div className="ml-auto text-right pl-4 border-l border-gray-100">
              <span className="block text-2xl font-black text-gray-900 leading-none">{totalInDepartment}</span>
              <span className="text-[9px] text-gray-400 font-bold uppercase">Active</span>
           </div>
        </div>
      </div>

      {/* --- FLOATING EXIT BUTTON (Top Right) --- */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => window.history.back()}
          className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] h-12 w-12 rounded-full flex items-center justify-center text-gray-600 hover:text-red-600 hover:scale-110 transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* --- MAP COMPONENT --- */}
      <div className="w-full h-full">
        <GoogleMap 
          mapContainerStyle={containerStyle} 
          center={center} // 2. Using the stable variable here instead of {{...}}
          zoom={5}
          options={mapOptions}
        >
          {markers.map((r) => (
            <Marker
              key={r.id}
              position={{ lat: r.lat, lng: r.lng }}
              icon={{
                url: icons[r.department] || "/icons/default-map-report.png",
                scaledSize: new window.google.maps.Size(42, 42),
                anchor: new window.google.maps.Point(21, 21),
              }}
              onClick={() => setSelected(r)}
              animation={window.google.maps.Animation.DROP}
            />
          ))}

          {selected && (
            <InfoWindow 
              position={{ lat: selected.lat, lng: selected.lng }} 
              onCloseClick={() => setSelected(null)} // This state update will no longer reload the map
              options={{ 
                 maxWidth: 340,
                 disableAutoPan: false,
                 pixelOffset: new window.google.maps.Size(0, -20)
              }}
            >
              <div className="w-[260px] font-sans">
                {/* Image Area */}
                <div className="relative h-36 w-full rounded-xl overflow-hidden shadow-inner bg-gray-50">
                   {selected.imageUrl ? (
                      <img src={selected.imageUrl} className="w-full h-full object-cover" alt="Incident" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs font-medium">
                         No Image
                      </div>
                   )}
                   <div className="absolute top-2 left-2">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 shadow-sm">
                         {selected.department}
                      </span>
                   </div>
                </div>

                {/* Content Area */}
                <div className="pt-3 pb-1">
                   <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">{selected.title}</h3>
                   <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                      {selected.description}
                   </p>

                   <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <div className="bg-white p-1 rounded-full shadow-sm">
                        <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-600 truncate flex-1">
                        {selected.address || "Location unavailable"}
                      </span>
                   </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}