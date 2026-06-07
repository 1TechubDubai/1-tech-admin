import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { 
  collection, onSnapshot, query, where, deleteDoc, 
  doc, setDoc, updateDoc, serverTimestamp 
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { 
  UserCheck, UserX, Clock, Mail, User, ShieldAlert, 
  KeyRound, AlertCircle, Building2, Fingerprint, 
  ShieldCheck, Users, Search, Power, Trash2
} from "lucide-react";
import Navbar from "../components/navbar";

const IAMPage = () => {
  const [view, setView] = useState("requests"); // 'requests' or 'roster'
  const [requests, setRequests] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [loadingId, setLoadingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminPass, setAdminPass] = useState("");

  // 1. Fetch Requests & Users
  useEffect(() => {
    // Listen for PENDING requests
    const qPending = query(collection(db, "registration_requests"), where("status", "==", "pending"));
    const unsubRequests = onSnapshot(qPending, (snapshot) => {
        setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen for ALL Users in the system
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        setSystemUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubRequests();
      unsubUsers();
    };
  }, []);

  // --- REQUEST APPROVAL LOGIC ---
  const triggerApproval = (request) => {
    setSelectedRequest(request);
    setIsVerifying(true);
  };

  const handleFinalApprove = async (e) => {
    e.preventDefault();
    setLoadingId(selectedRequest.id);
    const adminEmail = auth.currentUser.email;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        selectedRequest.email, 
        selectedRequest.password
      );
      const newUserId = userCredential.user.uid;

      await setDoc(doc(db, "users", newUserId), {
        uid: newUserId,
        fullName: selectedRequest.fullName,
        email: selectedRequest.email.toLowerCase(),
        organization: selectedRequest.organization || "1TecHub", 
        role: selectedRequest.requestedRole || "Member",
        status: true, 
        metadata: {
          approvedAt: serverTimestamp(),
          approvedBy: adminEmail,
          requestedAt: selectedRequest.requestedAt
        }
      });

      await deleteDoc(doc(db, "registration_requests", selectedRequest.id));
      await signInWithEmailAndPassword(auth, adminEmail, adminPass);

      setSuccessMsg(`Access granted to ${selectedRequest.fullName} as ${selectedRequest.requestedRole}.`);
      setIsVerifying(false);
      setAdminPass("");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (error) {
      console.error(error);
      alert("Verification Failed: " + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Permanently decline this registration?")) {
      await deleteDoc(doc(db, "registration_requests", id));
    }
  };

  // --- USER ROSTER LOGIC ---
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, "users", id), { 
        status: !currentStatus,
        "metadata.lastStatusChange": serverTimestamp()
      });
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update user status.");
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("WARNING: Deleting this profile permanently revokes their system access. Proceed?")) {
      try {
        await deleteDoc(doc(db, "users", id));
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Failed to purge user record.");
      }
    }
  };

  // Filters
  const internalRequests = requests.filter(r => r.requestedRole === "Lead" || r.requestedRole === "Admin");
  const externalRequests = requests.filter(r => r.requestedRole === "Member");
  
  const filteredUsers = systemUsers.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        
        {/* --- HEADER & NOTIFICATIONS --- */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-slate-400 to-slate-600 bg-clip-text text-transparent uppercase tracking-tighter">
            IAM Gatekeeper
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-mono uppercase tracking-widest">System Identity & Access Management</p>
        </div>

        {successMsg && (
          <div className="mb-8 p-4 bg-cyan-500/10 border border-cyan-500/50 rounded-2xl text-cyan-400 text-sm flex items-center gap-3 animate-bounce">
            <ShieldCheck size={18}/> {successMsg}
          </div>
        )}

        {/* --- TOGGLE TABS --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
            <button 
              onClick={() => setView("requests")}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${view === 'requests' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-slate-500 hover:text-white'}`}
            >
              Access Requests
              {requests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[10px] rounded-full flex items-center justify-center animate-bounce border-2 border-black">
                  {requests.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setView("roster")}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'roster' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-slate-500 hover:text-white'}`}
            >
              System Roster
            </button>
          </div>

          {view === "roster" && (
            <div className="w-full md:w-80 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search personnel..." 
                className="w-full bg-black/40 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-xs focus:border-purple-500 outline-none transition-all placeholder:text-slate-600"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* --- VIEW: ACCESS REQUESTS --- */}
        {view === "requests" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* INTERNAL OPS */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <Fingerprint className="text-purple-500" size={20}/>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Internal Ops Requests</h2>
                <div className="h-px flex-1 bg-slate-800/50 ml-4"></div>
              </div>
              
              <div className="space-y-4">
                {internalRequests.length > 0 ? (
                  internalRequests.map((req) => <RequestCard key={req.id} req={req} onApprove={triggerApproval} onReject={handleReject} isInternal={true}/>)
                ) : (
                  <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest text-center py-8 border border-dashed border-slate-800/40 rounded-[2rem]">No pending internal credentials</p>
                )}
              </div>
            </div>

            {/* PARTNER NETWORK */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="text-cyan-500" size={20}/>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Partner Network Requests</h2>
                <div className="h-px flex-1 bg-slate-800/50 ml-4"></div>
              </div>

              <div className="space-y-4">
                {externalRequests.length > 0 ? (
                  externalRequests.map((req) => <RequestCard key={req.id} req={req} onApprove={triggerApproval} onReject={handleReject} isInternal={false}/>)
                ) : (
                  <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest text-center py-8 border border-dashed border-slate-800/40 rounded-[2rem]">No pending partner credentials</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: SYSTEM ROSTER --- */}
        {view === "roster" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div key={user.id} className={`bg-slate-900/20 border ${user.status ? 'border-slate-800/60' : 'border-red-500/30 opacity-75'} rounded-[2rem] p-6 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all duration-500 hover:border-slate-600`}>
                  
                  <div className="flex items-center gap-6 w-full">
                    <div className={`w-14 h-14 bg-black border rounded-2xl flex items-center justify-center ${user.status ? 'border-slate-700 text-slate-400' : 'border-red-500/30 text-red-500'}`}>
                      {user.status ? <User size={24} /> : <UserX size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white truncate flex items-center gap-3">
                        {user.fullName} 
                        <span className={`text-[9px] px-3 py-1 rounded-full border uppercase tracking-widest ${
                          user.role === 'Lead' || user.role === 'Admin' 
                            ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' 
                            : 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10'
                        }`}>
                          {user.role}
                        </span>
                        {!user.status && (
                          <span className="text-[9px] px-3 py-1 rounded-full border border-red-500/50 text-red-400 bg-red-500/10 uppercase tracking-widest">
                            Suspended
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <Mail size={14} className="text-slate-600"/> {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs italic font-bold">
                          <Building2 size={14} className="text-slate-600"/> {user.organization}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button 
                      onClick={() => handleToggleStatus(user.id, user.status)} 
                      className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest ${
                        user.status 
                          ? 'border-amber-500/20 text-amber-500 hover:bg-amber-500/10' 
                          : 'border-green-500/20 text-green-500 hover:bg-green-500/10'
                      }`}
                    >
                      <Power size={14} />
                      {user.status ? "Deactivate" : "Activate"}
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)} 
                      className="p-3 bg-slate-800 rounded-2xl hover:text-red-500 transition-colors border border-transparent hover:border-red-500/30 hover:bg-red-500/10"
                      title="Purge Record"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center border border-dashed border-slate-800/50 rounded-[3rem]">
                <Users className="mx-auto text-slate-800 mb-4" size={48}/>
                <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs">No personnel match your query</h3>
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- ADMIN VERIFICATION MODAL --- */}
      {isVerifying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <form onSubmit={handleFinalApprove} className="bg-slate-900 border border-cyan-500/30 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                <KeyRound className="text-cyan-400" size={32}/>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Confirm Authority</h2>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest">Provisioning access for: <span className="text-white">{selectedRequest?.fullName}</span></p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Master Password</label>
              <input 
                autoFocus type="password" required
                className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all font-mono"
                placeholder="••••••••"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setIsVerifying(false); setAdminPass(""); }} className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-500 font-bold text-[10px] uppercase hover:bg-slate-800 transition-all">Abort</button>
              <button type="submit" disabled={loadingId} className="flex-[2] bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-cyan-900/40">
                {loadingId ? "PROVISIONING..." : "COMMIT ACCESS"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// Reusable Card Component for internal/external
const RequestCard = ({ req, onApprove, onReject, isInternal }) => (
  <div className={`bg-slate-900/20 border ${isInternal ? 'border-purple-500/20' : 'border-slate-800/60'} hover:border-cyan-500/30 rounded-[2rem] p-6 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all duration-500 group relative overflow-hidden`}>
    {isInternal && <div className="absolute top-0 right-0 p-1 px-3 bg-purple-500/10 text-purple-400 text-[8px] font-black uppercase tracking-widest rounded-bl-xl">Internal Priority</div>}
    
    <div className="flex items-center gap-6 w-full">
      <div className={`w-14 h-14 bg-black border rounded-2xl flex items-center justify-center transition-all ${isInternal ? 'border-purple-500/30 text-purple-400' : 'border-slate-800 text-slate-600'} group-hover:text-cyan-400 group-hover:border-cyan-500/50`}>
        <User size={28} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-bold text-white truncate flex items-center gap-3">
          {req.fullName} 
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isInternal ? 'border-purple-500/50 text-purple-400' : 'border-slate-700 text-slate-500'}`}>
            {req.requestedRole}
          </span>
        </h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Mail size={14} className="text-cyan-500/50"/> {req.email}
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs italic font-bold">
            <Building2 size={14} className="text-slate-600"/> {req.organization || "1TecHub"}
          </div>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-3 w-full lg:w-auto">
      <button onClick={() => onReject(req.id)} className="flex-1 lg:flex-none px-6 py-3 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest">Decline</button>
      <button onClick={() => onApprove(req)} className="flex-1 lg:flex-none px-8 py-3 rounded-2xl bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 transition-all font-black text-[10px] uppercase tracking-widest">Authorize</button>
    </div>
  </div>
);

export default IAMPage;