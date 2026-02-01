import { useState } from "react";
import { MapPin, Loader2, AlertCircle, Shield, Activity } from "lucide-react";
import { Button } from "../../../ui/button";
// Ensure this path is correct based on your folder structure
import { GRIEVANCE_CONFIG } from "./config"; 
import FloatingLines from "../../../ui/FloatingLines";

export default function LocationGuard({ onLocationGranted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Destructure config with fallbacks to prevent crashes
  const theme = GRIEVANCE_CONFIG?.theme || { gradient: "from-blue-500 to-cyan-500" };
  const icons = GRIEVANCE_CONFIG?.icons || {};

  const requestLocation = () => {
    setLoading(true);
    setError(null);

    if (!("geolocation" in navigator)) {
        setLoading(false);
        setError("Geolocation is not supported by this browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            // Artificial delay for better UX (prevents flickering)
            setTimeout(() => {
                setLoading(false);
                if (onLocationGranted) {
                    onLocationGranted({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                }
            }, 800);
        },
        (err) => {
            setLoading(false);
            console.error("Location Error:", err);
            
            // Refined error messages
            switch(err.code) {
                case 1: setError("Permission denied. Please allow location access in your browser settings."); break;
                case 2: setError("Position unavailable. Please check your GPS signal."); break;
                case 3: setError("Location request timed out."); break;
                default: setError("An unknown error occurred.");
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Safe array for icon mapping
  const serviceIcons = [
    icons.infra, 
    icons.waste, 
    icons.power, 
    icons.water
  ].filter(Boolean); // Removes undefined icons

  const MainIcon = icons.main || Activity; // Fallback icon

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 overflow-hidden font-sans">
      
      {/* Decorative Top Line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

      {/* Background Animation */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <FloatingLines />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-lg p-8 md:p-10 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center text-center relative z-10 animate-in zoom-in-95 duration-300 mx-4">
        
        {/* Central Icon Container */}
        <div className={`w-24 h-24 bg-gradient-to-br ${theme.gradient} rounded-full flex items-center justify-center mb-8 shadow-lg shadow-blue-900/20 ring-4 ring-white/5 transition-all`}>
            {loading ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
                <MapPin className="w-10 h-10 text-white" />
            )}
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            Enable Location
        </h2>
        
        <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8 max-w-xs md:max-w-sm">
          We need your precise coordinates to pinpoint infrastructure issues and route AI agents accurately.
        </p>

        {/* Service Icons Row */}
        {serviceIcons.length > 0 && (
            <div className="flex justify-center gap-6 mb-8 w-full border-y border-white/5 py-4">
            {serviceIcons.map((Icon, i) => (
                <Icon key={i} className="w-5 h-5 text-zinc-600" />
            ))}
            </div>
        )}

        {/* Error Message */}
        {error && (
            <div className="w-full mb-6 flex items-start gap-3 text-sm text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-left">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{error}</span>
            </div>
        )}

        {/* Action Area */}
        <div className="w-full space-y-6 mb-6">
            <Button 
                onClick={requestLocation}
                disabled={loading}
                className={`w-full h-14 text-lg bg-gradient-to-r ${theme.gradient} hover:opacity-90 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-[1.01] border-none`}
            >
                {loading ? "Acquiring Signal..." : "Allow Access"}
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-zinc-500">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted & Private</span>
            </div>
        </div>

        {/* Footer Branding */}
        <div className="flex items-center justify-center gap-2 text-zinc-600 opacity-60">
            <MainIcon className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-widest font-semibold">Official Grievance Portal</span>
        </div>
      </div>
    </div>
  );
}