import { useState, useEffect } from "react";
import { Camera, X, Loader2, CheckCircle2, Info, Map as MapIcon, UploadCloud, MapPin } from "lucide-react";
import { Button } from "../../../../ui/button";
import { api } from "../../../../lib/api"; 
import { useAuthStore } from "../../../../store/useAuthStore";
import { useAuth0 } from "@auth0/auth0-react";
import geohash from "ngeohash"; 
import ComplaintMap from "./ComplaintMap";

export default function ReportForm({ userLocation, userAddress, onSubmitSuccess }) {
  const [allReports, setAllReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, departments: {} });
  const [step, setStep] = useState("idle"); 
  const [imagePreview, setImagePreview] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [imageUrl, setImageUrl] = useState(null); 
  const [description, setDescription] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle"); 
  const [serverTool, setServerTool] = useState(null);

  const { getAccessTokenSilently } = useAuth0(); 
  const user = useAuthStore((state) => state.user);

  // Enhanced color palette for better visibility
  const departmentColors = {
    FIRE: "border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]",
    WATER: "border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]",
    ELECTRICITY: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]",
    WASTE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]",
    INFRASTRUCTURE: "border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)]",
    TOTAL: "border-zinc-700 bg-zinc-800 text-white"
  };

  useEffect(() => {
    fetchGlobalReports();
  }, []);

  const fetchGlobalReports = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/map-reports`);
      const json = await res.json();
      const reports = json.data || [];
      setAllReports(reports);

      const counts = reports.reduce((acc, r) => {
        acc.total++;
        acc.departments[r.department] = (acc.departments[r.department] || 0) + 1;
        return acc;
      }, { total: 0, departments: {} });

      setStats(counts);
    } catch (err) {
      console.error("Error fetching map stats:", err);
    }
  };

  const uploadToCloudinary = async (file) => {
    setUploadStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user?.id || "anonymous");
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json(); 
      setImageUrl(data.secure_url); 
      setUploadStatus("done");
    } catch (error) {
      setUploadStatus("error");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadToCloudinary(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!userLocation || !imageUrl) return;
    setStep("submitting");

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE, scope: "openid profile email" }
      });

      const geoHashId = geohash.encode(userLocation.lat, userLocation.lng, 6);

      const payload = {
          imageUrl: imageUrl,           
          description: description || "", 
          location: userLocation, 
          geohash: geoHashId, 
          address: userAddress || "Unknown Location",         
          status: "INITIATED",          
      };

      console.log("Handoff to AI Orchestrator:", payload);
      
      const response = await api.post(
        `${import.meta.env.VITE_API_PYTHON_URL}/reports`, 
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            timeout:60000
          }
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        setServerTool(response.data.tool || "SAVE");
        setStep("submitted");
        fetchGlobalReports();
        setTimeout(() => setStep("idle"), 8000);
      }
    } catch (error) {
      setStep("idle");
    }
  };

  if (step === "submitted") {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-10 animate-in fade-in zoom-in duration-300">
        <div className={`p-6 rounded-full ring-4 ring-opacity-20 ${serverTool === 'SAVE' ? 'bg-emerald-500/20 ring-emerald-500' : 'bg-blue-500/20 ring-blue-500'}`}>
          {serverTool === 'SAVE' ? 
            <CheckCircle2 className="w-16 h-16 text-emerald-500" /> : 
            <Info className="w-16 h-16 text-blue-500" />
          }
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {serverTool === 'SAVE' ? 'Report Submitted Successfully' : 'Update Received'}
          </h3>
          <p className="text-zinc-400 max-w-xs mx-auto text-sm">
            {serverTool === 'SAVE' 
              ? 'Our AI agents have analyzed the issue and assigned it for resolution.' 
              : 'This issue has already been reported. We have updated the existing record with your input.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => setStep("idle")} className="mt-4 border-zinc-700 hover:bg-zinc-800 text-zinc-300">
          Submit Another Report
        </Button>
      </div>
    );
  }

  const isReady = imagePreview && uploadStatus === 'done' && userLocation;

  return (
    <>
      {showMap && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 animate-in slide-in-from-bottom duration-300">
          <div className="absolute top-0 left-0 right-0 h-16 bg-zinc-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-50">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               <h2 className="text-white font-bold text-sm tracking-wide">Live Complaints Map</h2>
            </div>
            <button onClick={() => setShowMap(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-2 border border-zinc-700">
              <X size={14} /> Close Map
            </button>
          </div>
          <div className="w-full h-full pt-16">
            <ComplaintMap userLocation={userLocation} preloadedReports={allReports} />
          </div>
        </div>
      )}

      {!showMap && (
        <div className="w-full max-w-2xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-end pb-2">
             <div>
                <h2 className="text-xl font-bold text-white">New Report</h2>
                <p className="text-xs text-zinc-400">Upload evidence to route AI agents.</p>
             </div>
             {stats.total > 0 && (
                <div className="text-right">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Active Issues</span>
                    <p className="text-xl font-black text-white leading-none">{stats.total}</p>
                </div>
             )}
          </div>

          {/* Image Upload Area */}
          <div className="group relative aspect-video rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-500 transition-all cursor-pointer overflow-hidden shadow-inner">
            {imagePreview ? (
              <>
                <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" alt="upload" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2">
                        <Camera size={14} /> Retake Photo
                    </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                <div className="p-4 rounded-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                  <UploadCloud size={32} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">Tap to upload evidence</p>
                  <p className="text-xs">Support for JPG, PNG</p>
                </div>
              </div>
            )}
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} accept="image/*" />
            
            {uploadStatus === "uploading" && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
                <p className="text-xs font-medium text-zinc-300">Processing Image...</p>
              </div>
            )}
          </div>

          {/* Location Badge */}
          <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
             <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <MapPin size={18} />
             </div>
             <div className="overflow-hidden">
                <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Detected Location</p>
                <p className="text-sm text-blue-100 truncate font-medium">
                  {userAddress || <span className="animate-pulse">Triangulating coordinates...</span>}
                </p>
             </div>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <textarea
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none text-sm"
              placeholder="Describe the severity and details of the issue..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-5 gap-3">
            <Button 
                onClick={() => setShowMap(true)} 
                variant="outline"
                className="col-span-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white h-12 rounded-xl"
            >
              <MapIcon size={16} className="mr-2" /> 
              Map
            </Button>
            <Button 
                onClick={handleSubmit} 
                disabled={!isReady} 
                className={`col-span-3 h-12 rounded-xl font-bold shadow-lg transition-all ${
                    isReady 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/20" 
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
            >
              {step === "submitting" ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> 
                    <span>Analyzing...</span>
                </div>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>

          {/* Departmental Stats Grid */}
          {Object.keys(stats.departments).length > 0 && (
            <div className="pt-6 border-t border-zinc-800">
                <p className="text-xs font-semibold text-zinc-500 mb-4 uppercase tracking-widest">Live System Analytics</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {Object.entries(stats.departments).map(([dept, count]) => (
                    <div key={dept} className={`border p-3 rounded-xl flex flex-col justify-between h-20 transition-all hover:scale-[1.02] ${departmentColors[dept] || "border-zinc-800 bg-zinc-900 text-zinc-400"}`}>
                        <div className="flex justify-between items-start">
                            <p className="opacity-80 text-[9px] font-bold uppercase tracking-wider truncate pr-2">{dept}</p>
                        </div>
                        <p className="text-2xl font-black leading-none">{count}</p>
                    </div>
                    ))}
                </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}