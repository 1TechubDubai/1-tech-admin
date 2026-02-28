import React, { useContext, useState, useEffect } from "react";
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
  ChevronDown,
  Menu,
  X,
  Layers // Added for Member link
} from "lucide-react";
import logo from "../assets/logo.svg";

const Navbar = () => {
  // 1. Pull userDetails from context to get the role
  const { currentUser, userDetails } = useContext(Authcontext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // 2. Check if the user is an Admin or Lead
  const isPrivileged = userDetails?.role === "Admin" || userDetails?.role === "Lead";

  // 3. Conditionally define navigation links based on role
  const navLinks = isPrivileged 
    ? [
        { name: "IAM", path: "/", icon: <ShieldCheck className="w-4 h-4" /> },
        { name: "Messages", path: "/messages", icon: <MessageSquare className="w-4 h-4" /> },
        { name: "Partners", path: "/partners", icon: <Users className="w-4 h-4" /> },
        { name: "Blogs", path: "/blogs", icon: <Layers className="w-4 h-4" /> }
      ]
    : [
        // Give standard members a link to their deployment form
        { name: "My Node", path: "/submit-details", icon: <Layers className="w-4 h-4" /> }
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed w-full left-0 top-0 z-[100] bg-black/60 backdrop-blur-xl border-b border-cyan-500/20 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo Section */}
        <Link to={isPrivileged ? "/" : "/submit-details"} className="flex items-center gap-2 group shrink-0">
          <img src={logo} alt="1TechHub Logo" className="w-20 md:w-25 h-8 object-contain" />
          <span className="text-white font-black tracking-tighter text-lg hidden lg:block uppercase">
            {isPrivileged ? "Admin" : "Partner"}<span className="text-cyan-500">Portal</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center bg-slate-900/50 rounded-full px-2 py-1 border border-slate-800">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                isActive(link.path)
                  ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : "text-gray-400 hover:text-cyan-400"
              }`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </div>

        {/* User Section & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {/* User Profile - Desktop & Tablet */}
          <div className="relative hidden sm:block">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-full pl-2 pr-4 py-1.5 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                {/* Dynamically show their role instead of hardcoding "Admin" */}
                <p className="text-[10px] text-gray-500 uppercase font-black leading-none">
                  {userDetails?.role || "User"}
                </p>
                <p className="text-[11px] text-gray-200 font-bold truncate max-w-[100px]">
                  {currentUser?.email?.split('@')[0]}
                </p>
              </div>
              <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Desktop Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-slate-800 mb-2">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Session</p>
                  <p className="text-sm text-cyan-400 truncate font-medium">{currentUser?.email}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-1">
                    Org: {userDetails?.organization || "N/A"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-400 hover:bg-slate-800 transition-all"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <div className={`
        fixed inset-0 top-[65px] z-40 md:hidden transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? 'visible' : 'opacity-0 invisible pointer-events-none'}
      `}>
        <div className="flex flex-col p-6 space-y-4 bg-slate-900 border border-slate-800 rounded-2xl mx-4 mt-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Navigation</p>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-4 p-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${
                isActive(link.path)
                  ? "bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                  : "bg-slate-900/50 border border-slate-800 text-gray-400"
              }`}
            >
              <span className={isActive(link.path) ? "text-cyan-400" : "text-gray-500"}>
                {link.icon}
              </span>
              {link.name}
            </Link>
          ))}

          <div className="pt-8 mt-4 border-t border-slate-800/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Account</p>
            <div className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <UserIcon size={20} />
              </div>
              <div className="truncate">
                <p className="text-xs text-white font-bold truncate">{currentUser?.email}</p>
                <p className="text-[10px] text-gray-500 uppercase font-black">
                  {isPrivileged ? 'System Administrator' : 'Partner Representative'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 font-bold uppercase tracking-widest text-xs"
            >
              <LogOut size={18} />
              Terminate Session
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;        