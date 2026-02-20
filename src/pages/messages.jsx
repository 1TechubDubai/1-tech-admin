import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebaseConfig.js";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { Trash2, Search, Calendar, Mail, Settings, Send, X, ExternalLink, Filter, Check } from "lucide-react";
import Navbar from "../components/navbar.jsx";

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState([]); // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("desc");
  const [loading, setLoading] = useState(true);
  const filterRef = useRef(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [replyConfig, setReplyConfig] = useState({
    subject: "Re: Your Inquiry to Our Team",
    body: "Hi [Name],\n\nThank you for reaching out regarding [Service]. We have received your message and would love to discuss this further.\n\nBest regards,\nAdmin Team"
  });

  // Unique list of services for the filter dropdown
  const allAvailableServices = [
    'Intelligent Systems', 'Generative AI', 'Machine Learning', 
    'Computer Vision', 'NLP Solutions', 'Data Engineering', 
    'Strategic Consulting', 'Voice AI'
  ];

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", sortBy));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgData);
      setLoading(false);
    });

    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortBy]);

  const toggleServiceFilter = (service) => {
    setSelectedServices(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

    const handleReply = (msg) => {
        // Join multiple services into a string for the email body
        const serviceString = Array.isArray(msg.service_interest) 
        ? msg.service_interest.join(", ") 
        : (msg.service_interest || "our services");

        const customizedBody = replyConfig.body
        .replace("[Name]", msg.name || "Client")
        .replace("[Service]", serviceString);
        
        // Constructing the URL
        const mailtoUrl = `mailto:${msg.email}?subject=${encodeURIComponent(replyConfig.subject)}&body=${encodeURIComponent(customizedBody)}`;
        
        // Using window.open with security features
        // This opens the mail client while keeping your portal open and untouched
        const mailWindow = window.open(mailtoUrl, '_blank', 'noopener,noreferrer');
        
        // Optional: If some browsers block the popup, we close the blank tab immediately 
        // as the mail client handles the protocol.
        if (mailWindow) mailWindow.close();
    };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteDoc(doc(db, "messages", id));
      } catch (err) {
        console.error("Error deleting document: ", err);
      }
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          msg.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Multi-service filter logic
    const msgServices = Array.isArray(msg.service_interest) ? msg.service_interest : [msg.service_interest];
    const matchesService = selectedServices.length === 0 || 
                           selectedServices.some(s => msgServices.includes(s));

    return matchesSearch && matchesService;
  });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent uppercase tracking-tighter">
              Inbound Portal
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-md">
              Real-time monitoring and response management for client inquiries.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search database..." 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Multi-Service Filter */}
            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-3 bg-slate-900/50 border rounded-xl flex items-center gap-2 transition-all ${selectedServices.length > 0 ? 'border-cyan-500 text-cyan-400' : 'border-slate-800 text-white'}`}
              >
                <Filter className="w-5 h-5" />
                {selectedServices.length > 0 && <span className="text-xs font-bold">{selectedServices.length}</span>}
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95">
                  <div className="p-2 border-b border-slate-800 mb-2 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filter Services</span>
                    {selectedServices.length > 0 && (
                      <button onClick={() => setSelectedServices([])} className="text-[10px] text-cyan-500 hover:underline">Clear</button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {allAvailableServices.map(service => (
                      <button 
                        key={service}
                        onClick={() => toggleServiceFilter(service)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 transition-colors text-left text-xs"
                      >
                        <span className={selectedServices.includes(service) ? 'text-cyan-400 font-bold' : 'text-slate-300'}>{service}</span>
                        {selectedServices.includes(service) && <Check className="w-3 h-3 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <select 
              className="bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-4 pr-3 text-sm focus:border-cyan-500 outline-none cursor-pointer appearance-none"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="desc">Newest ￬</option>
              <option value="asc">Oldest ￬ </option>
            </select>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl hover:text-cyan-400 transition-colors"
              title="Response Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Grid */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-4">
              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
              <p className="text-cyan-500 font-mono text-xs tracking-widest uppercase">Syncing Communications...</p>
            </div>
          ) : filteredMessages.length > 0 ? (
            filteredMessages.map((msg) => (
              <div 
                key={msg.id} 
                className="group relative bg-slate-900/30 border border-slate-800/50 hover:border-cyan-500/40 p-5 md:p-8 rounded-[2rem] transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)] backdrop-blur-md"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Multi-Service Support: Rendering tags */}
                      {Array.isArray(msg.service_interest) ? (
                        msg.service_interest.map((service, idx) => (
                          <span key={idx} className="bg-cyan-500/10 text-cyan-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-cyan-500/20">
                            {service}
                          </span>
                        ))
                      ) : (
                        <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-cyan-500/20">
                          {msg.service_interest || "Inquiry"}
                        </span>
                      )}
                      
                      <span className="text-slate-500 text-[10px] flex items-center gap-1.5 uppercase font-bold tracking-tight ml-2">
                        <Calendar className="w-3 h-3" />
                        {msg.timestamp?.toDate().toLocaleDateString(undefined, { dateStyle: 'long' }) || "Recent"}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white group-hover:text-cyan-50 transition-colors">{msg.name}</h3>
                      <button 
                        onClick={() => handleReply(msg)}
                        className="text-cyan-500/80 hover:text-cyan-400 text-sm font-semibold flex items-center gap-2 transition-colors mt-1"
                      >
                        <Mail className="w-4 h-4" />
                        {msg.email}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <p className="text-slate-500 text-xs font-mono mt-2 uppercase tracking-tighter">
                        {msg.company ? `Entity: ${msg.company}` : "Private Client"} • {msg.phone_number || "No Phone"}
                      </p>
                    </div>
                    
                    <div className="p-5 bg-black/40 rounded-2xl border border-slate-800/50 text-slate-300 leading-relaxed text-sm md:text-base italic">
                      "{msg.message}"
                    </div>
                  </div>

                  <div className="flex lg:flex-col items-center justify-end gap-3 border-t lg:border-t-0 lg:border-l border-slate-800/50 pt-4 lg:pt-0 lg:pl-8">
                    <button 
                      onClick={() => handleReply(msg)}
                      className="flex-1 lg:flex-none p-4 bg-cyan-600/10 text-cyan-400 hover:bg-cyan-600 hover:text-white rounded-2xl transition-all duration-300"
                      title="Quick Reply"
                    >
                      <Send className="w-5 h-5 mx-auto" />
                    </button>
                    <button 
                      onClick={() => handleDelete(msg.id)}
                      className="flex-1 lg:flex-none p-4 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl transition-all duration-300"
                      title="Archive"
                    >
                      <Trash2 className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-32 border-2 border-dashed border-slate-800/50 rounded-[3rem]">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="text-slate-700 w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium italic">No messages match your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- SETTINGS MODAL --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-lg rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-cyan-400 uppercase tracking-widest">Reply Configuration</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Default Subject</label>
                <input 
                  type="text" 
                  className="w-full bg-black border border-slate-800 p-3 rounded-xl mt-1 text-white focus:border-cyan-500 outline-none"
                  value={replyConfig.subject}
                  onChange={(e) => setReplyConfig({...replyConfig, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Message Template</label>
                <p className="text-[10px] text-cyan-600 mb-2">Use [Name] and [Service] as placeholders.</p>
                <textarea 
                  className="w-full bg-black border border-slate-800 p-4 rounded-xl mt-1 text-white focus:border-cyan-500 outline-none h-40 resize-none text-sm"
                  value={replyConfig.body}
                  onChange={(e) => setReplyConfig({...replyConfig, body: e.target.value})}
                />
              </div>
            </div>

            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl font-black tracking-widest transition-all"
            >
              SAVE SETTINGS
            </button>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #06b6d4; }
      `}</style>
    </div>
  );
};

export default MessagesPage;