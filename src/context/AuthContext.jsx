import { createContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database'; // Add these imports
import { app } from '../firebase'; // Make sure you have this export in your firebase config

// Initialize Database
const db = getDatabase(app); // Add this line

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Realtime Database
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.exists() ? snapshot.val() : {};
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData.name || firebaseUser.email.split('@')[0],
          isAdmin: userData.isAdmin || false
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userRef = ref(db, `users/${userCredential.user.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.exists() ? snapshot.val() : {};
    
    const currentUser = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      name: userData.name || userCredential.user.email.split('@')[0],
      isAdmin: userData.isAdmin || false  // Critical for redirection logic
    };
    
    setUser(currentUser);
    return currentUser;  // Return user data to Login.jsx
  } catch (error) {
    throw error;
  }
};

const register = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // You can update the user profile here if needed
      // await updateProfile(userCredential.user, { displayName: name });
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};