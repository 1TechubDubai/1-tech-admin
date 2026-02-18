import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Authcontext, AuthContextProvider } from "./contextProvider";
import MessagesPage from "./pages/messages";
import PartnersPage from "./pages/partners";
import IAMPage from "./pages/iam";

// Import your components
import AuthPage from "./pages/auth";

/**
 * ProtectedRoute Component
 * Redirects to /login if there is no currentUser in the Authcontext
 */
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useContext(Authcontext);

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthContextProvider>
      <BrowserRouter basename='/'>
        <Routes>
          <Route path="/">
            {/* The Login/Signup Page */}
            <Route path="login" element={<AuthPage />} />

            {/* Protected Routes */}
            <Route
              index
              element={
                <ProtectedRoute>
                  <IAMPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="partners"
              element={
                <ProtectedRoute>
                  <PartnersPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback for undefined routes */}
            <Route path="*" element={<Navigate replace to="/login" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContextProvider>
  );
}

export default App;