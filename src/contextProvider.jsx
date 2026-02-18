import { createContext, useEffect, useState } from "react";
import { auth } from "./firebaseConfig"; // Adjust path to your firebase config
import { onAuthStateChanged } from "firebase/auth";

export const Authcontext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <Authcontext.Provider value={{ currentUser, setCurrentUser }}>
      {!loading && children}
    </Authcontext.Provider>
  );
};