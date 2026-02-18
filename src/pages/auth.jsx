import { useState, useContext } from "react";
import { db } from "../firebaseConfig.js"; // Import Firestore db
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig.js";
import { Authcontext } from "../contextProvider.jsx";
import { useNavigate } from "react-router-dom";
import { UserPlus, LogIn, ShieldAlert } from "lucide-react";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // New field
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const { setCurrentUser } = useContext(Authcontext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC (Approval Request) ---
        await addDoc(collection(db, "registration_requests"), {
          fullName,
          email,
          password, // Stored temporarily for admin to create account, or used for reference
          status: "pending",
          requestedAt: serverTimestamp(),
        });

        setInfoMessage("Registration request sent! Please wait for admin approval before you can sign in.");
        // Reset form
        setFullName("");
        setEmail("");
        setPassword("");
        setIsSignUp(false);
      } else {
        // --- SIGN IN LOGIC ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setCurrentUser(userCredential.user);
        navigate("/messages");
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid credentials or account not yet approved.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-gradient-to-br from-black via-slate-900 to-cyan-900 px-4">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20">
            {isSignUp ? <UserPlus className="text-cyan-400 w-8 h-8" /> : <LogIn className="text-cyan-400 w-8 h-8" />}
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white text-center mb-2 font-mono tracking-tighter">
          {isSignUp ? "REQUEST ACCESS" : "SYSTEM LOGIN"}
        </h2>
        
        {/* Toast / Info Message */}
        {infoMessage && (
          <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/50 rounded-xl flex items-start gap-3 animate-pulse">
            <ShieldAlert className="text-cyan-400 w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-cyan-100 text-xs leading-relaxed">{infoMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-gray-400 text-[10px] uppercase font-bold mb-2 tracking-widest">Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-[10px] uppercase font-bold mb-2 tracking-widest">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all"
              placeholder="admin@enterprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-[10px] uppercase font-bold mb-2 tracking-widest">Password</label>
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
            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg">
              <p className="text-red-400 text-xs italic">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-cyan-900/40 transition-all active:scale-[0.98] uppercase tracking-widest text-sm"
          >
            {isSignUp ? "Submit Request" : "Authenticate"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800 pt-6">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setInfoMessage("");
            }}
            className="text-gray-500 text-xs hover:text-cyan-400 transition-colors tracking-widest uppercase font-bold"
          >
            {isSignUp ? "Back to Login" : "Request New Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;