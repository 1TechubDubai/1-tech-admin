import React, { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Authcontext } from "../contextProvider.jsx";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { 
  MessageSquare, 
  ShieldCheck, 
  Users, 
  LogOut, 
  User as UserIcon,
  ChevronDown 
} from "lucide-react";
import logo from "../assets/logo.svg"; // Ensure you have a logo image at this path

const Navbar = () => {
  const { currentUser } = useContext(Authcontext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navLinks = [
    { name: "IAM", path: "/", icon: <ShieldCheck className="w-4 h-4" /> },
    { name: "Messages", path: "/messages", icon: <MessageSquare className="w-4 h-4" /> },
    { name: "Partners", path: "/partners", icon: <Users className="w-4 h-4" /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed w-full left-0 top-0 z-50 transparent backdrop-blur-xl border-b border-cyan-500/20 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="1TechHub Logo" className="w-25 h-8 px-2" />
          <span className="text-white font-bold tracking-widest text-lg hidden md:block">
            ADMIN<span className="text-cyan-500">PORTAL</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center bg-slate-900/50 rounded-full px-2 py-1 border border-slate-800">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive(link.path)
                  ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  : "text-gray-400 hover:text-cyan-400"
              }`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </div>

        {/* User Section */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-full pl-2 pr-4 py-1.5 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Authenticated as</p>
              <p className="text-xs text-gray-200 font-medium truncate max-w-[120px]">
                {currentUser?.email}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-800 mb-2">
                <p className="text-xs text-gray-500 italic">Connected session</p>
                <p className="text-sm text-cyan-400 truncate">{currentUser?.email}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;