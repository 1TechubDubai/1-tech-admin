import React, { useState, useEffect } from "react";
import { db, storage } from "../firebaseConfig.js";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  Plus, X, Image as ImageIcon, Link as LinkIcon, 
  Trash2, Edit3, ArrowRight
} from "lucide-react";
import { 
  // Original Icons
  MapPin, Activity, Truck, BarChart3, Box, Globe, Shield, Lock, MessageSquare, Video, Cloud, Search, Filter, Layers,
  // Navigation & UI
  Home, Settings, Menu, Bell, ChevronRight, ChevronLeft, MoreVertical, ExternalLink, RefreshCw, PlusCircle,
  // User & Security
  User, UserPlus, UserCheck, UserX, Fingerprint, Key, Eye, EyeOff, ShieldAlert,
  // Actions & Business
  Briefcase, CreditCard, DollarSign, PieChart, TrendingUp, Zap, HardDrive, Cpu, 
  // Status & Feedback
  CheckCircle2, AlertTriangle, Info, HelpCircle, Trash, Edit, Save, Send
} from 'lucide-react';

import Navbar from "../components/navbar.jsx";

const iconMap = {
  // --- Original Set ---
  MapPin, Activity, Truck, BarChart3, Box, Globe, Shield, Lock, MessageSquare, Video, Cloud, Search, Filter, Layers,

  // --- Navigation & Core UI ---
  Home,             // Dashboard home
  Settings,         // Configuration
  Menu,             // Sidebar toggle
  Bell,             // Notifications
  ChevronRight,     // List indicators
  ChevronLeft,      // Back buttons
  MoreVertical,     // Action menus
  ExternalLink,     // Partner website links
  RefreshCw,        // Sync/Reload data
  PlusCircle,       // Alternative Add button

  // --- User & Identity Management (IAM) ---
  User,             // Profile
  UserPlus,         // Registration requests
  UserCheck,        // Approved users
  UserX,            // Rejected users
  Fingerprint,      // Biometric/Security
  Key,              // Access control
  Eye,              // View details
  EyeOff,           // Hide details
  ShieldAlert,      // High-priority alerts

  // --- Business & Performance ---
  Briefcase,        // Partners/Corporate
  CreditCard,       // Billing/Subscriptions
  DollarSign,       // Revenue
  PieChart,         // Analytics
  TrendingUp,       // Growth metrics
  Zap,              // Automation/Features
  HardDrive,        // Storage/Database
  Cpu,              // Processing/AI

  // --- Status & CRUD Actions ---
  CheckCircle2,     // Success states
  AlertTriangle,    // Warnings
  Info,             // Information tooltips
  HelpCircle,       // Support/FAQ
  Trash,            // Delete actions
  Edit,             // Modify existing entries
  Save,             // Commit changes
  Send              // Message/Reply actions
};

const PartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "", sub: "", desc: "", link: "", theme: "#06b6d4",
    features: [{ label: "", icon: "Activity" }]
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "partners"), (snap) => {
      setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleUpload = async () => {
    if (!imageFile) return formData.image || "";
    const storageRef = ref(storage, `partners/${Date.now()}_${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const imageUrl = await handleUpload();
      const payload = { ...formData, image: imageUrl, updatedAt: serverTimestamp() };

      if (editingId) {
        await updateDoc(doc(db, "partners", editingId), payload);
      } else {
        await addDoc(collection(db, "partners"), { ...payload, createdAt: serverTimestamp() });
      }
      resetForm();
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ name: "", sub: "", desc: "", link: "", theme: "#06b6d4", features: [{ label: "", icon: "Activity" }] });
    setImageFile(null);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const addFeature = () => setFormData({...formData, features: [...formData.features, { label: "", icon: "Activity" }]});
  
  const removeFeature = (index) => {
    const newFeats = formData.features.filter((_, i) => i !== index);
    setFormData({...formData, features: newFeats});
  };

  const filteredPartners = partners.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sub?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20">
        
        {/* --- STATS DASHBOARD --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-slate-900/40 border border-slate-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] backdrop-blur-md">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-cyan-500/10 rounded-xl sm:rounded-2xl text-cyan-400"><Layers size={20} className="sm:w-6 sm:h-6"/></div>
              <div>
                <p className="text-[8px] sm:text-[10px] uppercase font-black text-slate-500 tracking-widest">Active Partners</p>
                <h4 className="text-2xl sm:text-3xl font-bold">{partners.length}</h4>
              </div>
            </div>
          </div>
          <div className="sm:col-span-1 lg:col-span-2 bg-slate-900/40 border border-slate-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] flex flex-col sm:flex-row items-center gap-3 sm:gap-0">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500 sm:w-[18px] sm:h-[18px]" size={16} />
              <input 
                type="text" 
                placeholder="Search partners..." 
                className="w-full bg-black/40 border border-slate-800 rounded-xl sm:rounded-2xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 text-sm focus:border-cyan-500 outline-none transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs tracking-widest transition-all shadow-lg shadow-cyan-900/20 ml-auto whitespace-nowrap"
            >
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> ADD NEW
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 sm:mb-12 flex items-end justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent uppercase tracking-tighter leading-tight">
              Partners Suite
            </h1>
            <p className="text-slate-400 mt-1 sm:mt-2 text-xs sm:text-sm">Design and deploy ecosystem profiles across the live platform.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="sm:hidden flex-shrink-0 p-3 sm:p-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl sm:rounded-2xl shadow-lg transition-all"><Plus size={20}/></button>
        </div>

        {/* Partners Grid */}
        <div className="space-y-6 sm:space-y-8">
          {filteredPartners.map((partner) => (
            <div 
              key={partner.id} 
              className="relative group border border-slate-800/60 bg-slate-900/20 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] overflow-hidden grid grid-cols-1 lg:grid-cols-2 transition-all duration-500 hover:border-cyan-500/30 hover:shadow-[0_0_40px_rgba(6,182,212,0.05)]"
            >
              <div className="p-4 sm:p-8 lg:p-12">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold uppercase tracking-tight break-words" style={{ color: partner.theme }}>{partner.name}</h2>
                    <p className="text-slate-400 font-medium italic text-xs sm:text-sm mt-1">{partner.sub}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => { setEditingId(partner.id); setFormData(partner); setIsModalOpen(true); }} className="p-2 sm:p-3 bg-slate-800/50 border border-slate-700 rounded-lg sm:rounded-xl hover:text-cyan-400 transition-colors"><Edit3 size={16} className="sm:w-[18px] sm:h-[18px]"/></button>
                    <button onClick={() => deleteDoc(doc(db, "partners", partner.id))} className="p-2 sm:p-3 bg-slate-800/50 border border-slate-700 rounded-lg sm:rounded-xl hover:text-red-500 transition-colors"><Trash2 size={16} className="sm:w-[18px] sm:h-[18px]"/></button>
                  </div>
                </div>
                
                <p className="text-slate-300 leading-relaxed mb-6 sm:mb-8 text-xs sm:text-sm lg:text-base">{partner.desc}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-10">
                  {partner.features?.map((f, i) => {
                    const Icon = iconMap[f.icon] || Activity;
                    return (
                      <div key={i} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-black/40 border border-slate-800/40 rounded-lg sm:rounded-2xl group/feat hover:border-slate-700 transition-colors">
                        <Icon size={14} className="sm:w-4 sm:h-4" style={{ color: partner.theme, flexShrink: 0 }} />
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-400 group-hover/feat:text-slate-200 transition-colors truncate">{f.label}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => window.open(partner.link)} 
                    className="flex-1 sm:flex-none px-6 sm:px-10 py-3 sm:py-4 rounded-lg sm:rounded-2xl font-black text-xs tracking-widest text-white transition-all hover:scale-105"
                    style={{ backgroundColor: partner.theme, boxShadow: `0 0 20px ${partner.theme}30` }}
                  >
                    VISIT PLATFORM
                  </button>
                </div>
              </div>
              
              <div className="bg-black/50 flex items-center justify-center p-6 sm:p-12 border-t lg:border-t-0 lg:border-l border-slate-800/50 relative overflow-hidden group-hover:bg-black/30 transition-colors min-h-[250px] sm:min-h-[300px]">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${partner.theme} 0%, transparent 70%)` }}></div>
                <img 
                  src={partner.image} 
                  alt="" 
                  className="max-h-48 sm:max-h-56 w-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 relative z-10 px-4 sm:px-0" 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- ADMIN MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <form 
            onSubmit={handleSubmit} 
            className="bg-slate-900 border border-cyan-500/30 w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl sm:rounded-3xl lg:rounded-[3rem] p-5 sm:p-8 lg:p-12 shadow-2xl relative my-auto"
          >
            <div className="flex justify-between items-start gap-4 mb-6 sm:mb-10 sticky top-0 bg-slate-900 pb-4 -mx-5 sm:-mx-8 lg:-mx-12 px-5 sm:px-8 lg:px-12">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">{editingId ? 'Edit Profile' : 'New Identity'}</h2>
                <p className="text-slate-500 text-[9px] sm:text-xs font-bold uppercase mt-1 tracking-widest">Partner Configuration</p>
              </div>
              <button type="button" onClick={resetForm} className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-full transition-colors flex-shrink-0"><X size={20} className="sm:w-6 sm:h-6"/></button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Entity Name</label>
                <input required className="w-full bg-black border border-slate-800 p-2.5 sm:p-4 rounded-lg sm:rounded-2xl mt-1 sm:mt-2 text-xs sm:text-base focus:border-cyan-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Accent Theme</label>
                <div className="flex gap-2 sm:gap-3 mt-1 sm:mt-2">
                  <input type="color" className="h-10 sm:h-14 w-16 sm:w-20 bg-black border border-slate-800 rounded-lg sm:rounded-2xl cursor-pointer p-0.5 sm:p-1" value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} />
                  <input className="flex-1 bg-black border border-slate-800 p-2 sm:p-4 rounded-lg sm:rounded-2xl uppercase text-xs font-mono font-bold text-cyan-500" value={formData.theme} readOnly />
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tagline</label>
                <input className="w-full bg-black border border-slate-800 p-2.5 sm:p-4 rounded-lg sm:rounded-2xl mt-1 sm:mt-2 text-xs sm:text-base focus:border-cyan-500 outline-none" value={formData.sub} onChange={e => setFormData({...formData, sub: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Project Abstract</label>
                <textarea className="w-full bg-black border border-slate-800 p-2.5 sm:p-5 rounded-lg sm:rounded-2xl mt-1 sm:mt-2 h-24 sm:h-32 resize-none text-xs sm:text-sm leading-relaxed focus:border-cyan-500 outline-none" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">External Link</label>
                <input className="w-full bg-black border border-slate-800 p-2.5 sm:p-4 rounded-lg sm:rounded-2xl mt-1 sm:mt-2 text-xs sm:text-base focus:border-cyan-500 outline-none" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Upload</label>
                <input type="file" className="w-full text-[8px] sm:text-[10px] text-slate-500 mt-1 sm:mt-2 file:bg-cyan-600/10 file:border-none file:text-cyan-400 file:px-3 sm:file:px-6 file:py-2 sm:file:py-3 file:rounded-lg sm:file:rounded-xl file:font-bold file:mr-2 sm:file:mr-4 file:cursor-pointer" onChange={e => setImageFile(e.target.files[0])} />
              </div>
            </div>

            <div className="mt-8 sm:mt-12 border-t border-slate-800/50 pt-6 sm:pt-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Capabilities Grid</h3>
                <button type="button" onClick={addFeature} className="text-[9px] sm:text-[10px] font-black bg-slate-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl uppercase tracking-widest hover:bg-slate-700 transition-colors w-full sm:w-auto">+ Add Node</button>
              </div>
                <div className="space-y-2 sm:space-y-3">
                {formData.features.map((feat, i) => {
                    const SelectedIcon = iconMap[feat.icon] || iconMap["Activity"];

                    return (
                    <div key={i} className="flex items-center gap-2 sm:gap-3 animate-in slide-in-from-right-2 group flex-wrap sm:flex-nowrap">
                        {/* Visual Icon Preview */}
                        <div className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center bg-black border border-slate-800 rounded-lg sm:rounded-xl text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.1)] group-hover:border-cyan-500/50 transition-all flex-shrink-0">
                        <SelectedIcon size={18} className="sm:w-5 sm:h-5" />
                        </div>

                        {/* Icon Selector */}
                        <select 
                        className="bg-black border border-slate-800 p-2 sm:p-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold uppercase w-28 sm:w-36 outline-none focus:border-cyan-500 transition-all cursor-pointer appearance-none" 
                        value={feat.icon} 
                        onChange={e => {
                            const newFeats = [...formData.features];
                            newFeats[i].icon = e.target.value;
                            setFormData({...formData, features: newFeats});
                        }}
                        >
                        {Object.keys(iconMap).sort().map(icon => (
                            <option key={icon} value={icon} className="bg-slate-900 text-white text-xs">
                            {icon}
                            </option>
                        ))}
                        </select>

                        {/* Label Input */}
                        <input 
                        className="flex-1 min-w-[120px] bg-black border border-slate-800 p-2 sm:p-3 rounded-lg sm:rounded-xl text-xs outline-none focus:border-cyan-500 transition-all" 
                        placeholder="Capability Label" 
                        value={feat.label} 
                        onChange={e => {
                            const newFeats = [...formData.features];
                            newFeats[i].label = e.target.value;
                            setFormData({...formData, features: newFeats});
                        }} 
                        />

                        {/* Remove Button */}
                        <button 
                        type="button" 
                        onClick={() => removeFeature(i)} 
                        className="p-2 sm:p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg sm:rounded-xl transition-all flex-shrink-0"
                        >
                        <X size={16} className="sm:w-[18px] sm:h-[18px]"/>
                        </button>
                    </div>
                    );
                })}
                </div>
            </div>

            <button disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 sm:py-5 rounded-lg sm:rounded-2xl lg:rounded-[2rem] font-black mt-8 sm:mt-12 tracking-[0.2em] shadow-xl shadow-cyan-900/40 transition-all disabled:opacity-50 uppercase text-xs">
              {loading ? "TRANSMITTING DATA..." : "DEPLOY PROFILE"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PartnersPage;