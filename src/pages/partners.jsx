import React, { useState, useEffect, useContext } from "react";
import { db, storage } from "../firebaseConfig.js";
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, 
  doc, serverTimestamp, query, orderBy 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Authcontext } from "../contextProvider.jsx";
import { 
  Plus, X, Trash2, Edit3, Search, Layers, Activity, Globe, 
  CheckCircle, ShieldAlert, Building2, Eye, ExternalLink, Zap,
  MapPin, Truck, BarChart3, Box, Shield, Lock, MessageSquare, Video, Cloud, Filter,
  Home, Settings, Menu, Bell, ChevronRight, ChevronLeft, MoreVertical, RefreshCw, PlusCircle,
  User, UserPlus, UserCheck, UserX, Fingerprint, Key, EyeOff,
  Briefcase, CreditCard, DollarSign, PieChart, TrendingUp, HardDrive, Cpu, 
  CheckCircle2, AlertTriangle, Info, HelpCircle, Trash, Edit, Save, Send
} from "lucide-react";
import Navbar from "../components/navbar.jsx";

const iconMap = { 
  MapPin, Activity, Truck, BarChart3, Box, Globe, Shield, Lock, MessageSquare, Video, Cloud, Search, Filter, Layers,
  Home, Settings, Menu, Bell, ChevronRight, ChevronLeft, MoreVertical, ExternalLink, RefreshCw, PlusCircle,
  User, UserPlus, UserCheck, UserX, Fingerprint, Key, Eye, EyeOff, ShieldAlert,
  Briefcase, CreditCard, DollarSign, PieChart, TrendingUp, Zap, HardDrive, Cpu, 
  CheckCircle2, AlertTriangle, Info, HelpCircle, Trash, Edit, Save, Send
};

const iconOptions = [
  { name: "Plus", icon: Plus },
  { name: "X", icon: X },
  { name: "Trash2", icon: Trash2 },
  { name: "Edit3", icon: Edit3 },
  { name: "Search", icon: Search },
  { name: "Layers", icon: Layers },
  { name: "Activity", icon: Activity },
  { name: "Globe", icon: Globe },
  { name: "CheckCircle", icon: CheckCircle },
  { name: "ShieldAlert", icon: ShieldAlert },
  { name: "Building2", icon: Building2 },
  { name: "Eye", icon: Eye },
  { name: "ExternalLink", icon: ExternalLink },
  { name: "Zap", icon: Zap },
  { name: "MapPin", icon: MapPin },
  { name: "Truck", icon: Truck },
  { name: "BarChart3", icon: BarChart3 },
  { name: "Box", icon: Box },
  { name: "Shield", icon: Shield },
  { name: "Lock", icon: Lock },
  { name: "MessageSquare", icon: MessageSquare },
  { name: "Video", icon: Video },
  { name: "Cloud", icon: Cloud },
  { name: "Filter", icon: Filter },
  { name: "Home", icon: Home },
  { name: "Settings", icon: Settings },
  { name: "Menu", icon: Menu },
  { name: "Bell", icon: Bell },
  { name: "ChevronRight", icon: ChevronRight },
  { name: "ChevronLeft", icon: ChevronLeft },
  { name: "MoreVertical", icon: MoreVertical },
  { name: "RefreshCw", icon: RefreshCw },
  { name: "PlusCircle", icon: PlusCircle },
  { name: "User", icon: User },
  { name: "UserPlus", icon: UserPlus },
  { name: "UserCheck", icon: UserCheck },
  { name: "UserX", icon: UserX },
  { name: "Fingerprint", icon: Fingerprint },
  { name: "Key", icon: Key },
  { name: "EyeOff", icon: EyeOff },
  { name: "Briefcase", icon: Briefcase },
  { name: "CreditCard", icon: CreditCard },
  { name: "DollarSign", icon: DollarSign },
  { name: "PieChart", icon: PieChart },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "HardDrive", icon: HardDrive },
  { name: "Cpu", icon: Cpu },
  { name: "CheckCircle2", icon: CheckCircle2 },
  { name: "AlertTriangle", icon: AlertTriangle },
  { name: "Info", icon: Info },
  { name: "HelpCircle", icon: HelpCircle },
  { name: "Trash", icon: Trash },
  { name: "Edit", icon: Edit },
  { name: "Save", icon: Save },
  { name: "Send", icon: Send }
];

const PartnersPage = () => {
  const { userDetails } = useContext(Authcontext);
  const [nodes, setNodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("live");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "", sub: "", desc: "", link: "", theme: "#06b6d4",
    organization: "Internal Ops",
    status: "active",
    features: [{ label: "", icon: "Activity" }],
    image: ""
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "service_listings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleApprove = async (id) => {
    await updateDoc(doc(db, "service_listings", id), { status: "active", updatedAt: serverTimestamp() });
  };

  const handleDisable = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "disabled" : "active";
    await updateDoc(doc(db, "service_listings", id), { status: nextStatus, updatedAt: serverTimestamp() });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, { label: "", icon: "Activity" }] });
  };

  const removeFeature = (index) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = formData.image || "";
      if (imageFile) {
        const storageRef = ref(storage, `service_assets/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      const payload = {
        name: formData.name,
        sub: formData.sub,
        desc: formData.desc,
        link: formData.link,
        theme: formData.theme,
        features: formData.features,
        image: imageUrl,
        organization: formData.organization || "Internal Ops",
        submittedBy: userDetails?.email || "admin@system.io",
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        await updateDoc(doc(db, "service_listings", editingId), payload);
      } else {
        await addDoc(collection(db, "service_listings"), { ...payload, status: "active", createdAt: serverTimestamp() });
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error deploying node.");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ name: "", sub: "", desc: "", link: "", theme: "#06b6d4", organization: "Internal Ops", status: "active", features: [{ label: "", icon: "Activity" }], image: "" });
    setImageFile(null);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const pendingCount = nodes.filter(n => n.status === "pending").length;

  const filteredNodes = nodes.filter(n => {
    const matchesSearch =
      n.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.organization?.toLowerCase().includes(searchTerm.toLowerCase());
    return view === "live"
      ? (n.status === "active" || n.status === "disabled") && matchesSearch
      : n.status === "pending" && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20">

        {/* ── TOGGLE + CONTROLS ── */}
        <div className="flex flex-col gap-4 mb-10">
          {/* Tab row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto">
              <button
                onClick={() => setView("live")}
                className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${view === "live" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/40" : "text-slate-500 hover:text-white"}`}
              >
                Live Nodes
              </button>
              <button
                onClick={() => setView("staging")}
                className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all relative ${view === "staging" ? "bg-amber-600 text-white shadow-lg shadow-amber-900/40" : "text-slate-500 hover:text-white"}`}
              >
                Staging Queue
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[10px] rounded-full flex items-center justify-center animate-bounce border-2 border-black">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            {/* Deploy button — full width on mobile */}
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="w-full sm:w-auto px-5 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-black text-[10px] sm:text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition-all"
            >
              <Plus size={15} /> Deploy Internal
            </button>
          </div>

          {/* Search — full width */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search capabilities..."
              className="w-full bg-black border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-xs focus:border-cyan-500 outline-none transition-all"
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* ── NODE LISTING ── */}
        <div className="space-y-4">
          {filteredNodes.length > 0 ? filteredNodes.map((node) => (
            <div
              key={node.id}
              className={`group bg-slate-900/20 border ${node.status === "disabled" ? "border-red-500/20 opacity-60" : "border-slate-800/60"} rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-5 sm:gap-8 transition-all hover:border-cyan-500/30`}
            >
              {/* Logo box */}
              <div className="w-full sm:w-40 lg:w-48 h-28 sm:h-32 bg-black rounded-2xl sm:rounded-3xl border border-slate-800 flex items-center justify-center p-4 relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle, ${node.theme} 0%, transparent 70%)` }} />
                {node.image ? (
                  <img src={node.image} alt="" className="max-h-full object-contain relative z-10 grayscale group-hover:grayscale-0 transition-all duration-500" />
                ) : (
                  <Layers size={28} className="text-slate-700 relative z-10" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 w-full text-center lg:text-left min-w-0">
                <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-2 sm:gap-3 mb-2 justify-center lg:justify-start">
                  <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight truncate max-w-full" style={{ color: node.theme }}>
                    {node.name}
                  </h3>
                  <span className="text-[10px] px-3 py-1 bg-slate-800 rounded-full text-slate-400 font-mono flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                    <Building2 size={10} /> {node.organization}
                  </span>
                </div>
                <p className="text-slate-400 text-sm italic mb-4 line-clamp-2">{node.sub}</p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                  {node.features?.map((f, i) => (
                    <div key={i} className="px-3 py-1 bg-black/40 border border-slate-800 rounded-full text-[9px] font-black text-slate-500 flex items-center gap-1.5">
                      {React.createElement(iconMap[f.icon] || Activity, { size: 10, style: { color: node.theme } })}
                      {f.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center lg:justify-end flex-shrink-0 flex-wrap">
                {view === "staging" ? (
                  <>
                    <button onClick={() => handleApprove(node.id)} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600/10 text-green-500 border border-green-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all">
                      Authorize
                    </button>
                    <button onClick={() => deleteDoc(doc(db, "service_listings", node.id))} className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleDisable(node.id, node.status)}
                      className={`px-3 sm:px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${node.status === "disabled" ? "bg-cyan-600 text-white border-cyan-600" : "border-slate-800 text-slate-500 hover:bg-slate-800"}`}
                    >
                      {node.status === "disabled" ? "Enable" : "Disable"}
                    </button>
                    <button
                      onClick={() => { setEditingId(node.id); setFormData(node); setIsModalOpen(true); }}
                      className="p-2.5 sm:p-3 bg-slate-800 rounded-xl hover:text-cyan-400 transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => deleteDoc(doc(db, "service_listings", node.id))}
                      className="p-2.5 sm:p-3 bg-slate-800 rounded-xl hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )) : (
            <div className="py-24 sm:py-32 text-center border-2 border-dashed border-slate-800/50 rounded-3xl sm:rounded-[3rem]">
              <Zap size={36} className="mx-auto text-slate-800 mb-4 opacity-20" />
              <p className="text-slate-600 font-mono text-[10px] uppercase tracking-[0.3em]">No Capability Nodes Found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center bg-black/95 backdrop-blur-md overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="relative mt-6 mb-6 bg-slate-900 border border-cyan-500/30 w-full max-w-3xl rounded-3xl sm:rounded-[3rem] p-5 sm:p-8 md:p-10 space-y-6 sm:space-y-8 animate-in zoom-in-95 max-h-[calc(100vh-3rem)] overflow-y-auto"
          >
            {/* Modal header */}
            <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-5 sm:pb-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-white leading-tight">
                  {editingId ? "Modify Capability Node" : "Deploy Internal Node"}
                </h2>
                <p className="text-cyan-500 text-[10px] font-mono uppercase tracking-[0.2em] mt-1">
                  Origin: {formData.organization || "Internal Ops"} // Mode: {editingId ? "OVERRIDE" : "INSERT"}
                </p>
              </div>
              <button type="button" onClick={resetForm} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white flex-shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Section 1 */}
            <div className="bg-black/20 border border-slate-800/50 p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] space-y-4">
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Building2 size={13} /> 01. Capability Meta
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Label</label>
                  <input
                    required
                    className="w-full bg-black border border-slate-800 p-3.5 sm:p-4 rounded-xl outline-none focus:border-cyan-500 text-sm"
                    placeholder="Autonomous Logistics Layer"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sub-Terminal Tagline</label>
                  <input
                    required
                    className="w-full bg-black border border-slate-800 p-3.5 sm:p-4 rounded-xl outline-none focus:border-cyan-500 text-sm"
                    placeholder="Neural Optimisation Engine"
                    value={formData.sub}
                    onChange={e => setFormData({ ...formData, sub: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Technical Abstract</label>
                  <textarea
                    required
                    className="w-full bg-black border border-slate-800 p-3.5 sm:p-4 rounded-xl h-24 resize-none outline-none focus:border-cyan-500 text-sm"
                    placeholder="Detailed technical specifications..."
                    value={formData.desc}
                    onChange={e => setFormData({ ...formData, desc: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-black/20 border border-slate-800/50 p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] space-y-4">
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Globe size={13} /> 02. External Linkage
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Source URL</label>
                  <input
                    className="w-full bg-black border border-slate-800 p-3.5 sm:p-4 rounded-xl outline-none focus:border-cyan-500 text-sm"
                    placeholder="https://terminal.io"
                    value={formData.link}
                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visual Accent</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      className="h-12 sm:h-14 w-16 sm:w-20 bg-black border border-slate-800 rounded-xl cursor-pointer p-1 flex-shrink-0"
                      value={formData.theme}
                      onChange={e => setFormData({ ...formData, theme: e.target.value })}
                    />
                    <div className="flex-1 bg-black border border-slate-800 p-3.5 sm:p-4 rounded-xl font-mono text-cyan-500 flex items-center uppercase text-xs truncate">
                      {formData.theme}
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Mapping (PNG/SVG)</label>
                  <div className="border-2 border-dashed border-slate-800 p-5 sm:p-6 rounded-xl hover:border-cyan-500/50 transition-all text-center group cursor-pointer">
                    <input type="file" className="hidden" id="admin-asset-upload" onChange={e => setImageFile(e.target.files[0])} />
                    <label htmlFor="admin-asset-upload" className="cursor-pointer block">
                      <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${imageFile ? "text-white" : "text-slate-500 group-hover:text-cyan-400"}`}>
                        {imageFile
                          ? `Linked: ${imageFile.name}`
                          : formData.image && editingId
                          ? "Click to replace existing visual"
                          : "Drag or click to upload system visual"}
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-black/20 border border-slate-800/50 p-5 sm:p-6 rounded-2xl sm:rounded-[2rem]">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layers size={13} /> 03. Functional Nodes
                </h3>
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-3 sm:px-4 py-2 bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all text-white flex items-center gap-1.5"
                >
                  <Plus size={10} /> Add Module
                </button>
              </div>
              <div className="space-y-3">
                {formData.features?.map((feat, i) => (
                  <div key={i} className="flex gap-2 sm:gap-3 items-center animate-in slide-in-from-right-2">
                    <div className="flex items-center gap-2 bg-black border border-slate-800 rounded-xl px-3">
                      {iconMap[feat.icon] && (
                        <span className="text-cyan-400 flex-shrink-0">
                          {React.createElement(iconMap[feat.icon], { size: 16 })}
                        </span>
                      )}
                      <select
                        className="bg-black py-3 sm:py-4 text-[10px] font-bold uppercase outline-none focus:border-cyan-500 cursor-pointer text-white"
                        value={feat.icon}
                        onChange={e => {
                          const f = [...formData.features];
                          f[i].icon = e.target.value;
                          setFormData({ ...formData, features: f });
                        }}
                      >
                        {iconOptions.map(opt => (
                          <option key={opt.name} value={opt.name}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      className="flex-1 min-w-0 bg-black border border-slate-800 p-3 sm:p-4 rounded-xl text-xs sm:text-sm outline-none focus:border-cyan-500 text-white"
                      placeholder="Module Capability"
                      value={feat.label}
                      onChange={e => {
                        const f = [...formData.features];
                        f[i].label = e.target.value;
                        setFormData({ ...formData, features: f });
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => removeFeature(i)}
                      className="p-3 text-slate-600 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 py-5 sm:py-6 rounded-2xl sm:rounded-[2rem] font-black text-[10px] tracking-[0.3em] sm:tracking-[0.4em] uppercase shadow-2xl shadow-cyan-900/40 transition-all disabled:opacity-50 text-white flex justify-center items-center gap-2"
            >
              {loading ? "Transmitting..." : editingId ? "Override Node Data" : "Commit Internal Deployment"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PartnersPage;