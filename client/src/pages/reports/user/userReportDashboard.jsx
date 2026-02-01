import React, { useState, useEffect } from "react";
import { 
  Trash2, 
  Filter, 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Droplets, 
  Trash, 
  Building2,
  CalendarDays,
  Check,
  UserCheck,
  HardHat,
  LayoutDashboard,
  Activity
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthStore } from "@/store/useAuthStore";

const UserReportsDashboard = ({ userId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL"); 
  const [filterCategory, setFilterCategory] = useState("ALL"); 
  
  const { getAccessTokenSilently } = useAuth0();
  const user = useAuthStore((s) => s.user);

  const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    if (dateVal._seconds) {
      return new Date(dateVal._seconds * 1000).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
      });
    }
    return new Date(dateVal).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = await getAccessTokenSilently({
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        });

        const res = await api.get("/api/user/reports", {
            headers: { Authorization: `Bearer ${token}` },
        });
        
        const apiData = res.data?.data || { waste: [], infrastructure: [], water: [] };

        const allReports = [
          ...(apiData.waste || []).map(r => ({ ...r, type: "WASTE" })),
          ...(apiData.infrastructure || []).map(r => ({ ...r, type: "INFRA" })),
          ...(apiData.water || []).map(r => ({ ...r, type: "WATER" })),
        ];

        allReports.sort((a, b) => {
            const dateA = a.createdAt?._seconds || 0;
            const dateB = b.createdAt?._seconds || 0;
            return dateB - dateA;
        });

        setReports(allReports);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load reports", error);
        setLoading(false);
      }
    };

    if (user) {
        fetchReports();
    }
  }, [getAccessTokenSilently, user]);

  const handleMarkResolved = async (reportId) => {
    const report = reports.find(r => r.id === reportId);
    const isWaiting = report?.status === "WAITING_APPROVAL";
    
    const confirmMsg = isWaiting 
      ? "Confirm that this issue has been fixed?" 
      : "Mark this report as resolved manually? This cannot be undone.";

    if (!window.confirm(confirmMsg)) return;

    try {
        const token = await getAccessTokenSilently({
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        });

        await api.put(`/api/reports/resolve`, 
            { reportId }, 
            { headers: { Authorization: `Bearer ${token}` }}
        );

        setReports((prev) => prev.map((r) => 
            r.id === reportId ? { ...r, status: "RESOLVED" } : r
        ));

    } catch (error) {
        console.error("Error resolving report:", error);
        alert("Failed to update status. Please try again.");
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (error) {
      alert("Failed to delete report");
    }
  };

  const getFilteredReports = () => {
    return reports.filter((report) => {
      if (filterCategory !== "ALL" && report.type !== filterCategory) return false;
      if (filterStatus === "RESOLVED") return report.status === "RESOLVED";
      if (filterStatus === "PENDING") return report.status !== "RESOLVED";
      return true;
    });
  };

  const filteredData = getFilteredReports();

  const getStatusBadge = (status) => {
    switch (status) {
        case "RESOLVED":
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <CheckCircle size={12} /> Resolved
                </span>
            );
        case "WAITING_APPROVAL":
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-purple-100 text-purple-700 border border-purple-200 animate-pulse">
                    <UserCheck size={12} /> Needs Approval
                </span>
            );
        case "ASSIGNED":
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-blue-100 text-blue-700 border border-blue-200">
                    <HardHat size={12} /> Assigned
                </span>
            );
        case "VERIFIED":
        default:
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-amber-100 text-amber-700 border border-amber-200">
                    <Clock size={12} /> Pending
                </span>
            );
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "WASTE": return <Trash className="text-orange-600" size={20} />;
      case "INFRA": return <Building2 className="text-blue-600" size={20} />;
      case "WATER": return <Droplets className="text-cyan-600" size={20} />;
      default: return <AlertTriangle size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
               <LayoutDashboard className="text-slate-400" /> My Dashboard
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
                Track and manage your submitted community reports.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:border-blue-200 transition-colors">
            <div>
                <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Reports</div>
                <div className="text-3xl font-bold text-slate-900">{reports.length}</div>
            </div>
            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                <LayoutDashboard size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:border-orange-200 transition-colors">
            <div>
                <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Pending</div>
                <div className="text-3xl font-bold text-orange-600">
                  {reports.filter(r => r.status !== "RESOLVED").length}
                </div>
            </div>
            <div className="h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                <Clock size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:border-emerald-200 transition-colors">
            <div>
                <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Resolved</div>
                <div className="text-3xl font-bold text-emerald-600">
                  {reports.filter(r => r.status === "RESOLVED").length}
                </div>
            </div>
            <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                <CheckCircle size={24} />
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-6">
          
          {/* Status Tabs */}
          <div className="bg-slate-100/80 p-1.5 rounded-xl flex gap-1 w-full lg:w-auto overflow-x-auto">
            {["ALL", "PENDING", "RESOLVED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-1 lg:flex-none text-center ${
                  filterStatus === tab 
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Filter size={14} /> Category
            </span>
            <div className="flex gap-2">
                {["ALL", "WASTE", "INFRA", "WATER"].map((cat) => (
                <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 py-1.5 border rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    filterCategory === cat
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                >
                    {cat}
                </button>
                ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
            <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-blue-600 rounded-full"></div>
            <p>Loading your reports...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <Filter size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No reports found</h3>
            <p className="text-slate-500">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredData.map((report) => (
              <div 
                key={report.id} 
                className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-200/50 transition-all duration-300 flex flex-col h-full overflow-hidden"
              >
                {/* Image / Header Section */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    {report.imageUrl ? (
                        <>
                            <img 
                                src={report.imageUrl} 
                                alt={report.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                            <div className="p-4 bg-white rounded-full shadow-sm mb-2">
                                {getTypeIcon(report.type)}
                            </div>
                            <span className="text-slate-400 text-xs font-medium">No Image Provided</span>
                        </div>
                    )}
                    
                    {/* Status Badge Positioned Absolutely */}
                    <div className="absolute top-3 right-3 shadow-sm z-10">
                        {getStatusBadge(report.status)}
                    </div>
                    
                    {/* Title overlaid on image if image exists, otherwise separate */}
                    {report.imageUrl && (
                        <div className="absolute bottom-3 left-4 right-4 text-white z-10">
                             <div className="flex items-center gap-2 mb-1 opacity-90">
                                {getTypeIcon(report.type)}
                                <span className="text-xs font-bold uppercase tracking-wider">{report.type}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Body Section */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* If no image, show category header here */}
                  {!report.imageUrl && (
                      <div className="flex items-center gap-2 mb-3 text-slate-500">
                         {getTypeIcon(report.type)}
                         <span className="text-xs font-bold uppercase tracking-wider">{report.type}</span>
                      </div>
                  )}

                  <h3 className="font-bold text-slate-900 text-lg mb-2 leading-tight">
                      {report.title || "Untitled Report"}
                  </h3>
                  
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
                    {report.description || report.aiAnalysis || <span className="italic text-slate-400">No additional details provided.</span>}
                  </p>
                  
                  {/* Metadata Block */}
                  <div className="mt-auto space-y-3">
                    <div className="bg-slate-50 rounded-lg p-3 flex items-start gap-3 border border-slate-100">
                        <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-600 font-medium line-clamp-2">
                            {report.address || "Location unavailable"}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                        <div className="flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            <span>{formatDate(report.createdAt)}</span>
                        </div>
                        {report.geohash && <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">ID: {report.geohash.substring(0,6)}...</span>}
                    </div>
                  </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      report.severity === "CRITICAL" ? "bg-red-50 text-red-600 border-red-100" :
                      report.severity === "HIGH" ? "bg-orange-50 text-orange-600 border-orange-100" :
                      "bg-blue-50 text-blue-600 border-blue-100"
                    }`}>
                      {report.severity || "NORMAL"} Priority
                    </span>

                    <div className="flex items-center gap-2">
                        {report.status !== "RESOLVED" && (
                            <button 
                                onClick={() => handleMarkResolved(report.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                                    report.status === "WAITING_APPROVAL" 
                                    ? "bg-green-600 text-white hover:bg-green-700 hover:shadow-md ring-2 ring-green-100"
                                    : "bg-white text-slate-600 border border-slate-200 hover:border-green-500 hover:text-green-600"
                                }`}
                                title="Mark as Resolved"
                            >
                                <Check size={14} />
                                {report.status === "WAITING_APPROVAL" ? "Confirm Fix" : "Resolve"}
                            </button>
                        )}

                        <button 
                          onClick={() => handleDelete(report.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                          title="Delete Report"
                        >
                          <Trash2 size={16} />
                        </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserReportsDashboard;