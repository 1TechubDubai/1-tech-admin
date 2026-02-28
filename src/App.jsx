import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Authcontext, AuthContextProvider } from "./contextProvider";
import MessagesPage from "./pages/messages";
import PartnersPage from "./pages/partners";
import IAMPage from "./pages/iam";
import AuthPage from "./pages/auth";
import PartnerFormPage from "./pages/partnerForm";
import BlogsPage from "./pages/blogs";

/**
 * RoleRoute Component
 * Directly uses the flattened user structure you provided.
 */
const RoleRoute = ({ children, allowedRoles }) => {
  // Destructure currentUser and userDetails from context
  const { currentUser, userDetails, loading } = useContext(Authcontext);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-cyan-500 font-mono tracking-widest">
        INITIALIZING TERMINAL...
      </div>
    );
  }

  // Check if either currentUser or userDetails (depending on how you store it) exists
  const activeUser = userDetails || currentUser;

  if (!activeUser) {
    return <Navigate to="/login" />;
  }

  // Safety check for deactivation
  if (activeUser.status === false) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono p-4 text-center">
        <div className="border border-red-500/50 p-8 rounded-2xl bg-red-500/5">
          <h1 className="text-xl font-black mb-2 uppercase">Access Revoked</h1>
          <p className="text-xs opacity-70">YOUR ACCOUNT HAS BEEN DEACTIVATED BY SYSTEM ADMINISTRATION.</p>
        </div>
      </div>
    );
  }

  // Role Validation: Check if the 'role' from your JSON matches allowedRoles
  if (allowedRoles && !allowedRoles.includes(activeUser.role)) {
    console.warn(`RESTRICTED: Role '${activeUser.role}' is not authorized for this sector.`);
    
    // If they are a Member trying to access Admin tools, send them to their form
    if (activeUser.role === "Member") {
      return <Navigate to="/submit-details" />;
    }
    
    // Otherwise, default back to login or a safe page
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthContextProvider>
      <BrowserRouter basename='/'>
        <Routes>
          <Route path="login" element={<AuthPage />} />

          {/* ADMIN & LEAD ACCESS: IAM, Messages, Partners */}
          <Route
            path="/"
            element={
              <RoleRoute allowedRoles={["Admin", "Lead"]}>
                <IAMPage />
              </RoleRoute>
            }
          />
          <Route
            path="messages"
            element={
              <RoleRoute allowedRoles={["Admin", "Lead"]}>
                <MessagesPage />
              </RoleRoute>
            }
          />
          <Route
            path="partners"
            element={
              <RoleRoute allowedRoles={["Admin", "Lead"]}>
                <PartnersPage />
              </RoleRoute>
            }
          />

          {/* PARTNER MEMBER ACCESS: Form Submission */}
          <Route
            path="submit-details"
            element={
              <RoleRoute allowedRoles={["Member"]}>
                <PartnerFormPage />
              </RoleRoute>
            }
          />

          <Route
            path="blogs"
            element={
              <RoleRoute allowedRoles={["Admin", "Lead"]}>
                <BlogsPage />
              </RoleRoute>
            }
          />

          {/* Global Redirect */}
          <Route path="*" element={<Navigate replace to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthContextProvider>
  );
}

export default App;