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

// Standard iconMap for rendering the actual icons on the live grid
const iconMap = { 
  MapPin, Activity, Truck, BarChart3, Box, Globe, Shield, Lock, MessageSquare, Video, Cloud, Search, Filter, Layers,
  Home, Settings, Menu, Bell, ChevronRight, ChevronLeft, MoreVertical, ExternalLink, RefreshCw, PlusCircle,
  User, UserPlus, UserCheck, UserX, Fingerprint, Key, Eye, EyeOff, ShieldAlert,
  Briefcase, CreditCard, DollarSign, PieChart, TrendingUp, Zap, HardDrive, Cpu, 
  CheckCircle2, AlertTriangle, Info, HelpCircle, Trash, Edit, Save, Send
};

// Dropdown options for the Modal form
const iconOptions = [
  { name: "Activity", icon: Activity },
  { name: "Zap", icon: Zap },
  { name: "Globe", icon: Globe },
  { name: "Shield", icon: Shield },
  { name: "Cloud", icon: Cloud },
  { name: "Cpu", icon: Cpu },
  { name: "Layers", icon: Layers }
];

const PartnersPage = () => {
  const { userDetails } = useContext(Authcontext);
  const [nodes, setNodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("live"); // 'live' or 'staging'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State optimized for Capability Nodes
  const [formData, setFormData] = useState({
    name: "", sub: "", desc: "", link: "", theme: "#06b6d4",
    organization: "Internal Ops",
    status: "active",
    features: [{ label: "", icon: "Activity" }],
    image: ""
  });
  const [imageFile, setImageFile] = useState(null);

  // Fetch all nodes
  useEffect(() => {
    const q = query(collection(db, "service_listings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Admin Actions
  const handleApprove = async (id) => {
    await updateDoc(doc(db, "service_listings", id), { status: "active", updatedAt: serverTimestamp() });
  };

  const handleDisable = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "disabled" : "active";
    await updateDoc(doc(db, "service_listings", id), { status: nextStatus, updatedAt: serverTimestamp() });
  };

  // Form Array Handlers
  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, { label: "", icon: "Activity" }] });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  // Form Submission Logic
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
        // New internal deployments default to 'active' immediately
        await addDoc(collection(db, "service_listings"), { 
          ...payload, 
          status: "active",
          createdAt: serverTimestamp() 
        });
      }
      resetForm();
    } catch (err) { 
      console.error(err); 
      alert("Error deploying node.");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ 
      name: "", sub: "", desc: "", link: "", theme: "#06b6d4", 
      organization: "Internal Ops", status: "active", features: [{ label: "", icon: "Activity" }], image: "" 
    });
    setImageFile(null); 
    setEditingId(null); 
    setIsModalOpen(false);
  };

  const filteredNodes = nodes.filter(n => {
    const matchesSearch = n.name?.toLowerCase().includes(searchTerm.toLowerCase()) || n.organization?.toLowerCase().includes(searchTerm.toLowerCase());
    return view === "live" ? (n.status === "active" || n.status === "disabled") && matchesSearch : n.status === "pending" && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        
        {/* --- TOGGLE TABS --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
            <button 
              onClick={() => setView("live")}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'live' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-slate-500 hover:text-white'}`}
            >
              Live Nodes
            </button>
            <button 
              onClick={() => setView("staging")}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${view === 'staging' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : 'text-slate-500 hover:text-white'}`}
            >
              Staging Queue
              {nodes.filter(n => n.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[10px] rounded-full flex items-center justify-center animate-bounce border-2 border-black">
                  {nodes.filter(n => n.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" placeholder="Search capabilities..." 
                className="w-full bg-black border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-xs focus:border-cyan-500 outline-none transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-black text-xs tracking-widest flex items-center gap-2 whitespace-nowrap shadow-lg shadow-cyan-900/40"
            >
              <Plus size={16}/> DEPLOY INTERNAL
            </button>
          </div>
        </div>

        {/* --- NODE LISTING --- */}
        <div className="space-y-4">
          {filteredNodes.length > 0 ? filteredNodes.map((node) => (
            <div key={node.id} className={`group bg-slate-900/20 border ${node.status === 'disabled' ? 'border-red-500/20 opacity-60' : 'border-slate-800/60'} rounded-[2.5rem] p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-8 transition-all hover:border-cyan-500/30`}>
              
              <div className="w-full lg:w-48 h-32 bg-black rounded-3xl border border-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
                 <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle, ${node.theme} 0%, transparent 70%)` }}></div>
                 {node.image ? (
                   <img src={node.image} alt="" className="max-h-full object-contain relative z-10 grayscale group-hover:grayscale-0 transition-all duration-500" />
                 ) : (
                   <Layers size={32} className="text-slate-700 relative z-10" />
                 )}
              </div>

              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold uppercase tracking-tight" style={{ color: node.theme }}>{node.name}</h3>
                  <span className="text-[10px] px-3 py-1 bg-slate-800 rounded-full text-slate-400 font-mono flex items-center gap-2">
                    <Building2 size={10}/> {node.organization}
                  </span>
                </div>
                <p className="text-slate-400 text-sm italic mb-4">{node.sub}</p>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                   {node.features?.map((f, i) => (
                     <div key={i} className="px-3 py-1 bg-black/40 border border-slate-800 rounded-full text-[9px] font-black text-slate-500 flex items-center gap-2">
                        {React.createElement(iconMap[f.icon] || Activity, { size: 10, style: { color: node.theme } })}
                        {f.label}
                     </div>
                   ))}
                </div>
              </div>

              <div className="flex gap-2">
                {view === "staging" ? (
                  <>
                    <button onClick={() => handleApprove(node.id)} className="px-6 py-3 bg-green-600/10 text-green-500 border border-green-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all">Authorize</button>
                    <button onClick={() => deleteDoc(doc(db, "service_listings", node.id))} className="px-6 py-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Reject</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleDisable(node.id, node.status)} className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${node.status === 'disabled' ? 'bg-cyan-600 text-white' : 'border-slate-800 text-slate-500 hover:bg-slate-800'}`}>
                      {node.status === 'disabled' ? 'Enable' : 'Disable'}
                    </button>
                    <button onClick={() => { setEditingId(node.id); setFormData(node); setIsModalOpen(true); }} className="p-3 bg-slate-800 rounded-xl hover:text-cyan-400 transition-colors"><Edit3 size={18}/></button>
                    <button onClick={() => deleteDoc(doc(db, "service_listings", node.id))} className="p-3 bg-slate-800 rounded-xl hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                  </>
                )}
              </div>
            </div>
          )) : (
            <div className="py-32 text-center border-2 border-dashed border-slate-800/50 rounded-[3rem]">
              <Zap size={40} className="mx-auto text-slate-800 mb-4 opacity-20" />
              <p className="text-slate-600 font-mono text-[10px] uppercase tracking-[0.3em]">No Capability Nodes Found</p>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL FOR INTERNAL ADD/EDIT --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-cyan-500/30 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-6 md:p-10 space-y-8 animate-in zoom-in-95 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                  {editingId ? 'Modify Capability Node' : 'Deploy Internal Node'}
                </h2>
                <p className="text-cyan-500 text-[10px] font-mono uppercase tracking-[0.2em] mt-1">
                  Origin: {formData.organization || "Internal Ops"} // Mode: {editingId ? "OVERRIDE" : "INSERT"}
                </p>
              </div>
              <button type="button" onClick={resetForm} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                <X size={24}/>
              </button>
            </div>
             
            {/* Section 1: Core Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 border border-slate-800/50 p-6 rounded-[2rem]">
              <div className="col-span-2">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Building2 size={14}/> 01. Capability Meta
                </h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Service Label</label>
                <input required className="w-full bg-black border border-slate-800 p-4 rounded-xl outline-none focus:border-cyan-500 text-sm" placeholder="Autonomous Logistics Layer" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sub-Terminal Tagline</label>
                <input required className="w-full bg-black border border-slate-800 p-4 rounded-xl outline-none focus:border-cyan-500 text-sm" placeholder="Neural Optimisation Engine" value={formData.sub} onChange={e => setFormData({...formData, sub: e.target.value})} />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Technical Abstract</label>
                <textarea required className="w-full bg-black border border-slate-800 p-4 rounded-xl h-24 resize-none outline-none focus:border-cyan-500 text-sm" placeholder="Detailed technical specifications..." value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
              </div>
            </div>

            {/* Section 2: Integration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 border border-slate-800/50 p-6 rounded-[2rem]">
              <div className="col-span-2">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Globe size={14}/> 02. External Linkage
                </h3>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Source URL</label>
                <input className="w-full bg-black border border-slate-800 p-4 rounded-xl outline-none focus:border-cyan-500 text-sm" placeholder="https://terminal.io" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Visual Accent</label>
                <div className="flex gap-4">
                  <input type="color" className="h-14 w-20 bg-black border border-slate-800 rounded-xl cursor-pointer p-1" value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} />
                  <div className="flex-1 bg-black border border-slate-800 p-4 rounded-xl font-mono text-cyan-500 flex items-center uppercase text-xs">
                    {formData.theme}
                  </div>
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Mapping (PNG/SVG)</label>
                <div className="border-2 border-dashed border-slate-800 p-6 rounded-xl hover:border-cyan-500/50 transition-all text-center group cursor-pointer">
                  <input type="file" className="hidden" id="admin-asset-upload" onChange={e => setImageFile(e.target.files[0])} />
                  <label htmlFor="admin-asset-upload" className="cursor-pointer">
                    <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${imageFile ? 'text-white' : 'text-slate-500 group-hover:text-cyan-400'}`}>
                      {imageFile ? `LINKED: ${imageFile.name}` : formData.image && editingId ? "CLICK TO REPLACE EXISTING VISUAL" : "DRAG OR CLICK TO UPLOAD SYSTEM VISUAL"}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 3: Technical Features */}
            <div className="bg-black/20 border border-slate-800/50 p-6 rounded-[2rem]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layers size={14}/> 03. Functional Nodes
                </h3>
                <button type="button" onClick={addFeature} className="px-4 py-2 bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all text-white">
                  + ADD MODULE
                </button>
              </div>

              <div className="space-y-4">
                {formData.features?.map((feat, i) => (
                  <div key={i} className="flex gap-4 animate-in slide-in-from-right-2">
                    <select 
                      className="bg-black border border-slate-800 p-4 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-cyan-500 cursor-pointer text-white"
                      value={feat.icon}
                      onChange={e => {
                        const newFeats = [...formData.features];
                        newFeats[i].icon = e.target.value;
                        setFormData({...formData, features: newFeats});
                      }}
                    >
                      {iconOptions.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                    </select>
                    <input 
                      className="flex-1 bg-black border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 text-white" 
                      placeholder="Module Capability"
                      value={feat.label}
                      onChange={e => {
                        const newFeats = [...formData.features];
                        newFeats[i].label = e.target.value;
                        setFormData({...formData, features: newFeats});
                      }}
                    />
                    <button type="button" onClick={() => removeFeature(i)} className="p-4 text-slate-600 hover:text-red-500 transition-colors">
                      <X size={18}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 py-6 rounded-[2rem] font-black text-[10px] tracking-[0.4em] uppercase shadow-2xl shadow-cyan-900/40 transition-all disabled:opacity-50 text-white flex justify-center items-center gap-2">
              {loading ? "TRANSMITTING..." : (editingId ? "OVERRIDE NODE DATA" : "COMMIT INTERNAL DEPLOYMENT")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PartnersPage;