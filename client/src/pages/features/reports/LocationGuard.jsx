import { useState } from "react";
import { MapPin, Shield, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../../../ui/button";
import FloatingLines from "../../../ui/FloatingLines";

export default function LocationGuard({ onLocationGranted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
            console.error("Location Error:", err);
            setLoading(false);
            
            if (err.code === 1) {
                setError("Permission denied. Please allow location access.");
            } else if (err.code === 2) {
                setError("Position unavailable. Check GPS.");
            } else if (err.code === 3) {
                setError("Request timed out.");
            } else {
                setError("An unknown error occurred.");
            }
        },
        {
            enableHighAccuracy: true, 
            timeout: 10000,
            maximumAge: 0
        }
    );
  };

  return (
    // UPDATED: 'fixed inset-0 z-50' forces it to cover the entire screen, ignoring parent padding
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 overflow-hidden">
      
      {/* Background Effect - Covers the entire fixed container */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <FloatingLines />
      </div>

      {/* Glass Card - Centered and Wide */}
      <div className="w-full max-w-2xl p-10 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-3xl shadow-2xl flex flex-col items-center text-center relative z-10 animate-in zoom-in-95 duration-300 mx-4">
        
        {/* Icon Circle */}
        <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-10 shadow-inner ring-1 ring-blue-500/20 transition-all">
            {loading ? (
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            ) : (
                <MapPin className="w-12 h-12 text-blue-500" />
            )}
        </div>

        {/* Header Text */}
        <div className="space-y-4 mb-10 max-w-lg">
            <h2 className="text-4xl font-bold text-white tracking-tight">Enable Location</h2>
            <p className="text-zinc-400 text-base leading-relaxed">
                We need your precise coordinates to pinpoint infrastructure issues and route AI agents accurately.
            </p>
        </div>

        {/* Error Message */}
        {error && (
            <div className="w-full max-w-lg mb-8 flex items-start gap-3 text-sm text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-left">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
            </div>
        )}

        {/* Action Button */}
        <div className="w-full max-w-lg space-y-6">
            <Button 
                onClick={requestLocation}
                disabled={loading}
                className="w-full h-16 text-xl bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.01] border-none"
            >
                {loading ? "Acquiring Signal..." : "Allow Access"}
            </Button>
            
            {/* Privacy Note */}
            <div className="flex items-center justify-center gap-2 text-zinc-500">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Encrypted & Private</span>
            </div>
        </div>
      </div>
    </div>
  );
}