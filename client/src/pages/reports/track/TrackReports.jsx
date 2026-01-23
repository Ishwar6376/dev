import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { api } from "../../../lib/api.js"; // Ensure correct path
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Loader2,
  AlertTriangle 
} from "lucide-react";
import { Button } from "../../../ui/button"; 

// Timeline Steps Configuration
const STEPS = [
  { status: "OPEN", label: "Report Submitted", description: "We have received your report." },
  { status: "VERIFIED", label: "Verified", description: "Authority has verified the location." },
  { status: "IN_PROGRESS", label: "In Progress", description: "Cleanup crew has been assigned." },
  { status: "RESOLVED", label: "Resolved", description: "The issue has been cleared." },
];

export default function TrackReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  useEffect(() => {
    const fetchReportDetails = async () => {
       
      try {
        const token = await getAccessTokenSilently({
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        });

        const res = await api.get(`/api/reports/garbage/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setReport(res.data.report || res.data); 
        console.log(res);
      } catch (err) {
        console.error("Error fetching track details:", err);
        setError("Could not load report details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReportDetails();
  }, [id, getAccessTokenSilently]);

  
  const getCurrentStepIndex = (status) => {
    const statusMap = {
      "OPEN": 0,
      "VERIFIED": 1,
      "IN_PROGRESS": 2,
      "RESOLVED": 3
    };
    return statusMap[status] ?? 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  
  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  
  if (error || !report) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-zinc-400 gap-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p>{error || "Report not found"}</p>
        <Button onClick={() => navigate(-1)} variant="outline" className="text-white border-white/20">
          Go Back
        </Button>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex(report.status || "OPEN");

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white font-sans relative overflow-x-hidden">
      
      
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none" />

      
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Track Request</h1>
          <p className="text-xs text-zinc-500 font-mono">ID: {id.slice(0, 8)}...</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 relative z-10">
        
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          
          <div className="lg:col-span-2 space-y-6">
            
            
            <div className={`
              p-6 rounded-2xl border flex items-center gap-4
              ${report.status === 'RESOLVED' 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}
            `}>
              {report.status === 'RESOLVED' ? <CheckCircle2 className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
              <div>
                <p className="text-sm font-semibold opacity-80 uppercase tracking-wider">Current Status</p>
                <h2 className="text-2xl font-bold text-white">{report.status || "OPEN"}</h2>
              </div>
            </div>

            
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
              {report.image && (
                <div className="relative h-64 w-full bg-black/50">
                  <img 
                    src={report.image} 
                    alt="Report" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-4 left-4 right-4">
                     <h3 className="text-xl font-bold text-white shadow-black drop-shadow-md">{report.title}</h3>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-zinc-500 mt-1" />
                  <div>
                    <p className="text-sm text-zinc-400">Location Coordinates</p>
                    <p className="text-white font-mono text-sm">
                      {report.location?.lat?.toFixed(6)}, {report.location?.lng?.toFixed(6)}
                    </p>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${report.location?.lat},${report.location?.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline mt-1 inline-block"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-zinc-500" />
                  <div>
                    <p className="text-sm text-zinc-400">Date Reported</p>
                    <p className="text-white text-sm">{formatDate(report.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Vertical Timeline */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-fit backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-6">Progress History</h3>
            
            <div className="relative pl-4 space-y-8">
              {/* Vertical Line */}
              <div className="absolute top-2 left-[23px] h-[calc(100%-24px)] w-0.5 bg-white/10" />

              {STEPS.map((step, index) => {
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={step.status} className="relative flex gap-4 group">
                    {/* Dot */}
                    <div className={`
                      relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 transition-all duration-500
                      ${isCompleted 
                        ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                        : 'bg-slate-900 border-white/20 text-zinc-500'}
                    `}>
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                    </div>

                    {/* Text */}
                    <div className={`${isCompleted ? 'opacity-100' : 'opacity-40'} transition-opacity duration-500`}>
                      <p className={`text-sm font-bold ${isCurrent ? 'text-blue-400' : 'text-white'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                        {step.description}
                      </p>
                      {/* Optional: Add timestamps for each step if your backend provides them */}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}