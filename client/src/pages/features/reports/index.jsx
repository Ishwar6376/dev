import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Map as MapIcon, List } from "lucide-react";
import { WATER_FEATURE } from "./config";
import LocationGuard from "./LocationGuard"; 
import ReportSidebar from "./ components/ReportSidebar"; 
import FloatingLines from "../../../ui/FloatingLines"; 
import { Button } from "../../../ui/button"; 
import { useReverseGeocoding } from "../../../hooks/useReverseGeocoding";

export default function ComplaintsPage() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [mobileTab, setMobileTab] = useState("map");
  
  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);

  const { userAddress: detectedAddress, loading: addressLoading } = useReverseGeocoding(
    userLocation?.lat,
    userLocation?.lng
  );

  const handleLocationGranted = (coords) => {
    setUserLocation(coords);
  };

  const handleReportSubmitted = () => {
    setMapRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="relative h-screen w-full bg-slate-950 text-white flex flex-col overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* 1. Global Ambient Background (Gradient ONLY - No FloatingLines here) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950" />
      </div>

      {/* 2. Header (Now includes FloatingLines) */}
      <header className="relative z-50 h-16 bg-black/20 backdrop-blur-xl border-b border-white/10 overflow-hidden">
        
        {/* Floating Lines for Header */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <FloatingLines />
        </div>

        {/* Header Content */}
        <div className="relative z-10 h-full px-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-zinc-400 hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${WATER_FEATURE.theme.bgAccent} border border-blue-500/20`}>
                    <WATER_FEATURE.icons.main className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                    {WATER_FEATURE.title}
                </h1>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium mt-0.5">
                    {WATER_FEATURE.subtitle}
                </p>
                </div>
            </div>
            </div>
        </div>
      </header>

      {/* 3. Main Content */}
      <div className="flex-1 flex relative z-10 overflow-hidden">
        
        {!userLocation ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <LocationGuard onLocationGranted={handleLocationGranted} />
          </div>
        ) : (
          <>
            {/* Sidebar Container (Now includes FloatingLines) */}
            <div 
              className={`
                absolute inset-0 lg:static lg:w-[450px] flex flex-col 
                bg-slate-950/95 lg:bg-black/40 backdrop-blur-3xl 
                border-r border-white/10 z-30 lg:z-20 relative overflow-hidden
                transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
                ${mobileTab === 'report' ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              `}
            >
              {/* Floating Lines for Sidebar */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                 <FloatingLines />
              </div>

              {/* Sidebar Content */}
              <div className="relative z-10 h-full">
                <ReportSidebar 
                    userLocation={userLocation} 
                    userAddress={addressLoading ? "Locating..." : detectedAddress} 
                    onReportSubmitGlobal={handleReportSubmitted}
                />
              </div>
            </div>

            {/* Map Area (Clean - No Lines) */}
            <div className="flex-1 relative bg-slate-900/50">
               {/* Map Placeholder or Component */}
               {/* <WaterMap key={mapRefreshTrigger} userLocation={userLocation} refreshTrigger={mapRefreshTrigger} /> */}
            </div>
          </>
        )}

        {/* Mobile Toggle Pill */}
        {userLocation && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 lg:hidden">
             <div className="flex p-1 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
                <button 
                  onClick={() => setMobileTab('map')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${mobileTab === 'map' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-zinc-400'}`}
                >
                  <MapIcon className="w-4 h-4" /> Map
                </button>
                <button 
                  onClick={() => setMobileTab('report')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${mobileTab === 'report' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-zinc-400'}`}
                >
                  <List className="w-4 h-4" /> Report
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}