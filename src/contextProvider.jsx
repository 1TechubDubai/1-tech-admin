import { createContext, useEffect, useState } from "react";
import { auth, db } from "./firebaseConfig"; 
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export const Authcontext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  
  // 1. Initialize state from localStorage for instant recovery on reload
  const [userDetails, setUserDetails] = useState(() => {
    const savedData = localStorage.getItem("userDetails");
    return savedData ? JSON.parse(savedData) : null;
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true); 
      
      if (user) {
        setCurrentUser(user);
        
        try {
          // 2. Background Sync: Fetch fresh data from Firestore
          const userQuery = query(
            collection(db, "users"),
            where("email", "==", user.email.toLowerCase())
          );
          
          const querySnapshot = await getDocs(userQuery);

          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            
            // 3. Update both State and LocalStorage with fresh data
            setUserDetails(data);
            localStorage.setItem("userDetails", JSON.stringify(data));
          } else {
            console.warn("No Firestore document found.");
            setUserDetails(null);
            localStorage.removeItem("userDetails");
          }
        } catch (error) {
          console.error("Error syncing user identity:", error);
          // Fallback: If network fails, we still have the localStorage data in state
        }
      } else {
        // 4. Cleanup: User logged out
        setCurrentUser(null);
        setUserDetails(null);
        localStorage.removeItem("userDetails");
      }
      
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <Authcontext.Provider value={{ 
      currentUser, 
      userDetails, 
      loading, 
      setCurrentUser, 
      setUserDetails 
    }}>
      {children}
    </Authcontext.Provider>
  );
};