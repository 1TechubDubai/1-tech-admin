import { useState, useContext } from "react";
import { db } from "../firebaseConfig.js"; 
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig.js";
import { Authcontext } from "../contextProvider.jsx";
import { useNavigate } from "react-router-dom";
import { UserPlus, LogIn, ShieldAlert, Building2, Briefcase } from "lucide-react";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState(""); // New: Org Field
  const [role, setRole] = useState("Member"); // Creative addition: Role selection
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const { setCurrentUser, setUserDetails } = useContext(Authcontext);
  const navigate = useNavigate();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setOrganization("");
    setRole("Member");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC (No changes here) ---
        await addDoc(collection(db, "registration_requests"), {
          fullName,
          email,
          organization,
          requestedRole: role,
          password, 
          status: "pending", 
          requestedAt: serverTimestamp(),
        });
        setInfoMessage(`Access request for ${organization} submitted. Systems are verifying.`);
        resetForm(); // Helper to clear states
        setIsSignUp(false);
      } else {
        // --- SIGN IN LOGIC ---
        // 1. Authenticate with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        // 2. Fetch specialized data from 'users' collection via email
        const userQuery = query(
          collection(db, "users"), 
          where("email", "==", email.toLowerCase())
        );
        
        const querySnapshot = await getDocs(userQuery);

        if (querySnapshot.empty) {
          throw new Error("User record not found in database.");
        }

        const userData = querySnapshot.docs[0].data();
        console.log("Fetched user data from Firestore:", userData);
        // 3. Security Check: Is the account active?
        if (userData.status !== true) {
          await auth.signOut();
          setError("ACCESS DENIED: Your account is currently inactive or pending approval.");
          return;
        }

        // Store the custom Firestore data as a string
        localStorage.setItem("userDetails", JSON.stringify(userData));
        
        // --- CHANGE THIS SECTION ---
        // 4. Update Context with both Auth and Firestore data
        setCurrentUser(fbUser);         // Sets the Firebase Auth user
        setUserDetails(userData);       // Sets the Firestore JSON (role, organization, etc.)

        // 5. Role-Based Redirection
        if (userData.role === "Admin" || userData.role === "Lead") {
          navigate("/"); 
        } else {
          navigate("/submit-details"); 
        }
      }
    } catch (err) {
      console.error(err);
      const msg = err.code === "auth/user-not-found" || err.code === "auth/wrong-password" 
        ? "INVALID CREDENTIALS" 
        : err.message.toUpperCase();
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-gradient-to-br from-black via-slate-900 to-cyan-900 px-4">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all duration-500">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            {isSignUp ? <UserPlus className="text-cyan-400 w-8 h-8" /> : <LogIn className="text-cyan-400 w-8 h-8" />}
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white text-center mb-2 font-mono tracking-tighter">
          {isSignUp ? "REQUEST ACCESS" : "SYSTEM LOGIN"}
        </h2>
        
        <p className="text-center text-slate-500 text-[10px] tracking-[0.2em] mb-8 uppercase">
          {isSignUp ? "Submit credentials for vetting" : "Enter encrypted terminal"}
        </p>
        
        {infoMessage && (
          <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/50 rounded-xl flex items-start gap-3 animate-pulse">
            <ShieldAlert className="text-cyan-400 w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-cyan-100 text-xs leading-relaxed">{infoMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="group">
                <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1.5 tracking-widest group-focus-within:text-cyan-400 transition-colors">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-700"
                    placeholder="IDENTIFY SELF"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1.5 tracking-widest group-focus-within:text-cyan-400 transition-colors">Organization</label>
                <div className="relative">
                  <Building2 className="absolute right-3 top-3 text-slate-600 w-4 h-4" />
                  <input
                    type="text"
                    required
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-700"
                    placeholder="CORP / AGENCY"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1.5 tracking-widest">Clearance Level</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                >
                  <option value="Member">Standard Member</option>
                  <option value="Admin">Lead / Admin</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1.5 tracking-widest">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1.5 tracking-widest">Password</label>
            <input
              type="password"
              required
              className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <p className="text-red-400 text-[10px] font-mono uppercase italic">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-cyan-900/40 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs mt-4"
          >
            {isSignUp ? "Initialize Request" : "Authenticate Session"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800 pt-6">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setInfoMessage("");
            }}
            className="text-gray-500 text-[10px] hover:text-cyan-400 transition-colors tracking-widest uppercase font-bold"
          >
            {isSignUp ? "Return to Terminal" : "Request System Credentials"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;