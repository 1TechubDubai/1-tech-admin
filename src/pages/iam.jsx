import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, onSnapshot, query, where, deleteDoc, doc, getCountFromServer } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { 
  UserCheck, UserX, ShieldCheck, Clock, Mail, 
  User, Loader2, Users, AlertCircle, KeyRound, X 
} from "lucide-react";
import Navbar from "../components/navbar";

const IAMPage = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ totalRequests: 0, systemUsers: 0 });
  const [loadingId, setLoadingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  
  // States for the custom Verification Modal
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminPass, setAdminPass] = useState("");

  // 1. Fetch Requests & System Stats
    useEffect(() => {
    // Listen for PENDING requests (for the list)
    const qPending = query(collection(db, "registration_requests"), where("status", "==", "pending"));
    const unsubRequests = onSnapshot(qPending, (snapshot) => {
        setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setStats(prev => ({ ...prev, totalRequests: snapshot.size }));
    });

    // Listen for APPROVED users count
    // We use a query to filter by status before counting
    const fetchApprovedCount = async () => {
        try {
        const qApproved = query(
            collection(db, "registration_requests"), 
            where("status", "==", "approved")
        );
        const snapshot = await getCountFromServer(qApproved);
        setStats(prev => ({ ...prev, systemUsers: snapshot.data().count }));
        } catch (error) {
        console.error("Error fetching approved count:", error);
        }
    };

    fetchApprovedCount();

    return () => unsubRequests();
    }, []);

  // 2. Open Verification Modal
  const triggerApproval = (request) => {
    setSelectedRequest(request);
    setIsVerifying(true);
  };

  // 3. Final Approval Logic
  const handleFinalApprove = async (e) => {
    e.preventDefault();
    setLoadingId(selectedRequest.id);
    const adminEmail = auth.currentUser.email;

    try {
      // Step A: Create User
      await createUserWithEmailAndPassword(auth, selectedRequest.email, selectedRequest.password);
      // Step B: Cleanup
      await deleteDoc(doc(db, "registration_requests", selectedRequest.id));
      // Step C: Re-auth Admin
      await signInWithEmailAndPassword(auth, adminEmail, adminPass);

      setSuccessMsg(`Access granted to ${selectedRequest.fullName}.`);
      setIsVerifying(false);
      setAdminPass("");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-[#020617] text-white bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        
        {/* --- DASHBOARD STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400"><Clock size={24}/></div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Pending Requests</p>
                <h4 className="text-3xl font-bold">{stats.totalRequests}</h4>
              </div>
            </div>
          </div>
          {/* <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400"><Users size={24}/></div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">System Users</p>
                <h4 className="text-3xl font-bold">{stats.systemUsers}</h4>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-cyan-500/20 p-6 rounded-3xl backdrop-blur-md flex items-center justify-center">
             <p className="text-cyan-500 font-mono text-[10px] animate-pulse">SYSTEM STATUS: OPTIMAL</p>
          </div> */}
        </div>

        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-slate-400 to-slate-600 bg-clip-text text-transparent uppercase tracking-tighter">
              Identity Portal
            </h1>
            <p className="text-slate-500 mt-2 text-sm">Authorized personnel only. Reviewing inbound access credentials.</p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-8 p-4 bg-cyan-500/10 border border-cyan-500/50 rounded-2xl text-cyan-400 text-sm flex items-center gap-3">
            <UserCheck size={18}/> {successMsg}
          </div>
        )}

        {/* Request Cards */}
        <div className="space-y-4">
          {requests.length > 0 ? (
            requests.map((req) => (
              <div 
                key={req.id} 
                className="bg-slate-900/20 border border-slate-800/60 hover:border-cyan-500/30 rounded-[2rem] p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all duration-500 group"
              >
                <div className="flex items-center gap-6 w-full">
                  <div className="hidden sm:flex w-14 h-14 bg-black border border-slate-800 rounded-2xl items-center justify-center text-slate-600 group-hover:text-cyan-400 group-hover:border-cyan-500/50 transition-all duration-500">
                    <User size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate">{req.fullName}</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <Mail size={14} className="text-cyan-500/50"/> {req.email}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
                        <Clock size={14}/> {req.requestedAt?.toDate().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <button
                    onClick={() => handleReject(req.id)}
                    className="flex-1 lg:flex-none px-6 py-3 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => triggerApproval(req)}
                    className="flex-1 lg:flex-none px-8 py-3 rounded-2xl bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    Authorize
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-32 text-center border-2 border-dashed border-slate-800/50 rounded-[3rem]">
              <AlertCircle className="mx-auto text-slate-800 mb-4" size={48}/>
              <h3 className="text-slate-500 font-bold uppercase tracking-widest text-sm">Security Queue Clear</h3>
            </div>
          )}
        </div>
      </div>

      {/* --- ADMIN VERIFICATION MODAL --- */}
      {isVerifying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <form 
            onSubmit={handleFinalApprove}
            className="bg-slate-900 border border-cyan-500/30 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                <KeyRound className="text-cyan-400" size={32}/>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Identity Verification</h2>
              <p className="text-slate-500 text-xs">Confirm your admin credentials to authorize <b>{selectedRequest?.fullName}</b></p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Password</label>
              <input 
                autoFocus
                type="password" 
                required
                className="w-full bg-black border border-slate-800 p-4 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                placeholder="••••••••"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => { setIsVerifying(false); setAdminPass(""); }}
                className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-500 font-bold text-xs uppercase hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loadingId}
                className="flex-[2] bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-900/40 disabled:opacity-50"
              >
                {loadingId ? "Authorizing..." : "Confirm Access"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default IAMPage;