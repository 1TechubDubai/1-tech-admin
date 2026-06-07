import { useState, useContext, useEffect } from "react";
import { db, storage } from "../firebaseConfig.js";
import { 
  collection, addDoc, updateDoc, doc, serverTimestamp, 
  onSnapshot, query, where 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Authcontext } from "../contextProvider";
import { 
  Zap, Plus, X, Activity, Globe, Shield, 
  Cloud, Cpu, Layers, Send, CheckCircle2, Building2, Loader2, Edit3, Clock
} from "lucide-react";
import Navbar from "../components/navbar.jsx";

const iconOptions = [
  { name: "Activity", icon: Activity },
  { name: "Zap", icon: Zap },
  { name: "Globe", icon: Globe },
  { name: "Shield", icon: Shield },
  { name: "Cloud", icon: Cloud },
  { name: "Cpu", icon: Cpu },
  { name: "Layers", icon: Layers }
];

const PartnerFormPage = () => {
  const { userDetails, loading: authLoading } = useContext(Authcontext);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myNodes, setMyNodes] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    sub: "",
    desc: "",
    link: "",
    theme: "#06b6d4",
    features: [{ label: "", icon: "Activity" }],
    image: ""
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (userDetails?.email) {
      const q = query(
        collection(db, "service_listings"),
        where("submittedBy", "==", userDetails.email)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setMyNodes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }
  }, [userDetails]);

  const handleAddFeature = () => {
    setFormData({ ...formData, features: [...formData.features, { label: "", icon: "Activity" }] });
  };

  const handleRemoveFeature = (index) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });
  };

  const handleEdit = (node) => {
    setEditingId(node.id);
    setFormData({
      name: node.name || "",
      sub: node.sub || "",
      desc: node.desc || "",
      link: node.link || "",
      theme: node.theme || "#06b6d4",
      features: node.features || [{ label: "", icon: "Activity" }],
      image: node.image || ""
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", sub: "", desc: "", link: "", theme: "#06b6d4", features: [{ label: "", icon: "Activity" }], image: "" });
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userDetails?.organization || !userDetails?.email) {
      alert("Identity Sync Error: Please wait for system authorization or re-login.");
      return;
    }
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
        organization: userDetails.organization,
        submittedBy: userDetails.email,
        submitterName: userDetails.fullName,
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        await updateDoc(doc(db, "service_listings", editingId), { ...payload, status: "pending" });
      } else {
        await addDoc(collection(db, "service_listings"), { ...payload, status: "pending", createdAt: serverTimestamp() });
      }
      setSubmitted(true);
      cancelEdit();
    } catch (err) {
      console.error("Transmission Error:", err);
      alert("System Error: Failed to transmit capability data.");
    } finally {
      setLoading(false);
    }
  };

  const accent = editingId ? "#f59e0b" : "#06b6d4";
  const accentClass = editingId ? "text-amber-400" : "text-cyan-400";
  const borderClass = editingId ? "border-amber-500/40" : "border-slate-800/50";
  const focusBorder = editingId ? "focus:border-amber-500" : "focus:border-cyan-500";
  const btnClass = editingId
    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/40"
    : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/40";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="text-cyan-500 animate-spin mb-4" size={40} />
        <p className="text-cyan-500 text-xs tracking-[0.3em] font-mono uppercase">Synchronizing Secure Identity...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-sm w-full border border-cyan-500/30 bg-slate-900/30 p-8 rounded-3xl text-center backdrop-blur-xl">
          <CheckCircle2 className="text-cyan-400 w-14 h-14 mx-auto mb-5 animate-pulse" />
          <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-3">Node Transmitted</h2>
          <p className="text-slate-400 text-xs leading-relaxed mb-8 uppercase tracking-widest">
            Identity: {userDetails?.organization}<br/>
            Status: Awaiting Admin Verification
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="w-full py-4 bg-cyan-600 text-white rounded-xl font-black text-[10px] tracking-widest hover:bg-cyan-500 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-24">
      <Navbar />

      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32">

        {/* ── HEADER ── */}
        <div className="mb-10 border-l-4 pl-5 animate-in slide-in-from-left duration-700" style={{ borderColor: accent }}>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase italic leading-tight">
            Capability <span style={{ color: accent }}>Node</span>{" "}
            {editingId ? "Modification" : "Deployment"}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent }} />
            <p className="text-slate-400 text-[10px] font-mono uppercase tracking-[0.2em]">
              Origin: {userDetails?.organization} // Mode: {editingId ? "OVERRIDE" : "INSERT"}
            </p>
          </div>
        </div>

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1 */}
          <div className={`bg-slate-900/20 border ${borderClass} p-5 sm:p-8 rounded-3xl backdrop-blur-md transition-all`}>
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 ${accentClass}`}>
              <Building2 size={14} /> 01. Capability Meta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Label</label>
                <input
                  required
                  className={`w-full bg-black/50 border border-slate-800 p-3.5 sm:p-4 rounded-xl outline-none transition-all placeholder:text-slate-700 text-sm ${focusBorder}`}
                  placeholder="Autonomous Logistics Layer"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sub-Terminal Tagline</label>
                <input
                  required
                  className={`w-full bg-black/50 border border-slate-800 p-3.5 sm:p-4 rounded-xl outline-none transition-all placeholder:text-slate-700 text-sm ${focusBorder}`}
                  placeholder="Neural Optimisation Engine"
                  value={formData.sub}
                  onChange={e => setFormData({ ...formData, sub: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Technical Abstract</label>
                <textarea
                  required
                  className={`w-full bg-black/50 border border-slate-800 p-3.5 sm:p-4 rounded-xl h-28 sm:h-32 resize-none outline-none transition-all placeholder:text-slate-700 text-sm ${focusBorder}`}
                  placeholder="Detailed technical specifications..."
                  value={formData.desc}
                  onChange={e => setFormData({ ...formData, desc: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className={`bg-slate-900/20 border ${borderClass} p-5 sm:p-8 rounded-3xl backdrop-blur-md transition-all`}>
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 ${accentClass}`}>
              <Globe size={14} /> 02. External Linkage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Source URL</label>
                <input
                  className={`w-full bg-black/50 border border-slate-800 p-3.5 sm:p-4 rounded-xl outline-none transition-all text-sm placeholder:text-slate-700 ${focusBorder}`}
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
                  <div className="flex-1 bg-black/50 border border-slate-800 p-3.5 sm:p-4 rounded-xl font-mono text-cyan-500 flex items-center uppercase text-xs truncate">
                    {formData.theme}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Mapping (PNG/SVG)</label>
                <div className={`border-2 border-dashed border-slate-800 p-6 sm:p-8 rounded-xl transition-all text-center group cursor-pointer ${editingId ? "hover:border-amber-500/50" : "hover:border-cyan-500/50"}`}>
                  <input type="file" className="hidden" id="asset-upload" onChange={e => setImageFile(e.target.files[0])} />
                  <label htmlFor="asset-upload" className="cursor-pointer block">
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
          <div className={`bg-slate-900/20 border ${borderClass} p-5 sm:p-8 rounded-3xl backdrop-blur-md transition-all`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 ${accentClass}`}>
                <Layers size={14} /> 03. Functional Nodes
              </h3>
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 sm:px-4 py-2 bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-1.5"
              >
                <Plus size={10} /> Add Module
              </button>
            </div>

            <div className="space-y-3">
              {formData.features.map((feat, i) => (
                <div key={i} className="flex gap-2 sm:gap-4 items-center animate-in slide-in-from-right-2">
                  <select
                    className={`bg-black border border-slate-800 p-3 sm:p-4 rounded-xl text-[10px] font-bold uppercase outline-none cursor-pointer flex-shrink-0 ${focusBorder}`}
                    value={feat.icon}
                    onChange={e => {
                      const f = [...formData.features];
                      f[i].icon = e.target.value;
                      setFormData({ ...formData, features: f });
                    }}
                  >
                    {iconOptions.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                  </select>
                  <input
                    className={`flex-1 min-w-0 bg-black/50 border border-slate-800 p-3 sm:p-4 rounded-xl text-xs sm:text-sm outline-none ${focusBorder}`}
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
                    onClick={() => handleRemoveFeature(i)}
                    className="p-3 text-slate-600 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="w-full sm:flex-1 bg-slate-800 py-5 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase hover:bg-slate-700 transition-all"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:flex-[2] py-5 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase shadow-2xl transition-all disabled:opacity-30 flex items-center justify-center gap-3 ${btnClass}`}
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={16} /> Transmitting...</>
              ) : editingId ? (
                "Override Capability Node"
              ) : (
                "Deploy Capability Node"
              )}
            </button>
          </div>
        </form>

        {/* ── HISTORY ── */}
        <div className="border-t border-slate-800/50 mt-16 pt-14">
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase italic">
              Transmission <span className="text-cyan-500">History</span>
            </h2>
            <p className="text-slate-500 text-xs font-mono mt-1">Review and manage previously deployed service listings.</p>
          </div>

          <div className="space-y-4">
            {myNodes.length > 0 ? myNodes.map((node) => (
              <div
                key={node.id}
                className="bg-slate-900/20 border border-slate-800/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-cyan-500/30 transition-all group"
              >
                {/* Left */}
                <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border border-slate-800 bg-black flex items-center justify-center overflow-hidden flex-shrink-0">
                    {node.image ? (
                      <img
                        src={node.image}
                        alt="Node Graphic"
                        className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                      />
                    ) : (
                      <Layers size={18} className="text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base sm:text-lg font-bold uppercase tracking-tight truncate" style={{ color: node.theme }}>
                      {node.name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Clock size={11} />
                      {node.updatedAt?.toDate().toLocaleDateString() || "Just now"}
                    </p>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                    node.status === "active"
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : node.status === "disabled"
                      ? "bg-slate-800 text-slate-500 border border-slate-700"
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}>
                    {node.status || "Pending"}
                  </div>
                  <button
                    onClick={() => handleEdit(node)}
                    className="p-2.5 sm:p-3 bg-slate-800 hover:bg-cyan-600/20 hover:text-cyan-400 rounded-xl transition-all"
                    title="Edit Node"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-14 text-center border border-dashed border-slate-800 rounded-3xl">
                <Cloud size={30} className="mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">No previous transmissions detected</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PartnerFormPage;