import { useState } from "react";
import { Camera, X, Loader2, CheckCircle2, Info } from "lucide-react";
import { Button } from "../../../../ui/button";
import { api } from "../../../../lib/api"; 
import { useAuthStore } from "../../../../store/useAuthStore";
import { useAuth0 } from "@auth0/auth0-react";
import geohash from "ngeohash"; 
import ComplaintMap from "./ComplaintMap";
import { db } from "../../../../firebase/firebase"; // double-check this path

export default function ReportForm({ userLocation, userAddress, onSubmitSuccess }) {
  const [step, setStep] = useState("idle"); 
  const [imagePreview, setImagePreview] = useState(null);
  const [showMap, setShowMap] = useState(false); // fullscreen toggle

  const [imageUrl, setImageUrl] = useState(null); 
  const [description, setDescription] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle"); 
  const [serverTool, setServerTool] = useState(null);

  const { getAccessTokenSilently } = useAuth0(); 
  const user = useAuthStore((state) => state.user);

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
      console.log("response coming from backend",response.data.tool)

      if (response.status === 200 || response.status === 201) {
        setServerTool(response.data.tool || "SAVE");
        setStep("submitted");
        setTimeout(() => setStep("idle"), 8000);
      }
    } catch (error) {
      setStep("idle");
    }
  };

  if (step === "submitted") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full ${serverTool === 'SAVE' ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
          {serverTool === 'SAVE' ? <CheckCircle2 className="text-emerald-500" /> : <Info className="text-blue-500" />}
        </div>
        <h3 className="text-xl font-bold">{serverTool === 'SAVE' ? 'Report Saved' : 'Update Received'}</h3>
        <p className="text-zinc-400 text-center">{serverTool === 'SAVE' ? 'Assigned for resolution.' : 'Already reported; we noted your input.'}</p>
      </div>
    );
  }

  const isReady = imagePreview && uploadStatus === 'done' && userLocation;
return (
  <>
    {/* ================= FULLSCREEN MAP ================= */}
    {showMap && (
      <div className="fixed inset-0 z-50 bg-black animate-fade-in">
        
        {/* TOP BAR */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-zinc-900/95 backdrop-blur border-b border-white/10 flex items-center justify-between px-4 z-50">
          <h2 className="text-white font-bold text-sm tracking-wide">
            📍 Public Complaints Map
          </h2>

          <button
            onClick={() => setShowMap(false)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            ← Back to Report
          </button>
        </div>

        {/* MAP */}
        <div className="w-full h-full pt-14">
          <ComplaintMap userLocation={userLocation} />
        </div>
      </div>
    )}

    {/* ================= REPORT FORM ================= */}
    {!showMap && (
      <div className="w-full max-w-2xl mx-auto space-y-6">

        <div className="relative aspect-video rounded-xl border-2 border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
          {imagePreview ? (
            <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" alt="upload" />
          ) : (
            <Camera className="text-zinc-500" />
          )}
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
          {uploadStatus === "uploading" && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-xs text-zinc-400 truncate">
          {userAddress || "Detecting location..."}
        </div>

        <textarea
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white h-24"
          placeholder="Details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex gap-2">
          <Button
            onClick={() => setShowMap(true)}
            className="flex-1 bg-purple-600 text-white"
          >
            View Map 🗺️
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!isReady}
            className="flex-1 bg-blue-600 text-white"
          >
            {step === "submitting" ? <Loader2 className="animate-spin" /> : "Submit"}
          </Button>
        </div>

      </div>
    )}
  </>
);
}