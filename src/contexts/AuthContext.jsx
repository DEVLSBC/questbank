// Contexto de Autenticação - Gerencia o estado do usuário logado
import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cadastro de novo usuário
  const register = async (nome, cpf, email, senha) => {
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Atualizar perfil com nome
      await updateProfile(user, { displayName: nome });

      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        nome: nome,
        email: email,
        cpf: cpf,
        createdAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { success: false, error: error.message };
    }
  };

  // Login
  const login = async (email, senha) => {
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      return { success: true };
    } catch (error) {
      console.error('Erro no logout:', error);
      return { success: false, error: error.message };
    }
  };

  // Atualizar senha
  const updateUserPassword = async (newPassword) => {
    try {
      await updatePassword(currentUser, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      return { success: false, error: error.message };
    }
  };

  // Atualizar nome
  const updateUserName = async (newName) => {
    try {
      await updateProfile(currentUser, { displayName: newName });
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...userData,
        nome: newName
      }, { merge: true });
      
      // Recarregar dados do usuário
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      return { success: false, error: error.message };
    }
  };

  // Atualizar logo do usuário
  const updateUserLogo = async (logoBase64) => {
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...userData,
        logoBase64: logoBase64
      }, { merge: true });
      
      // Recarregar dados do usuário
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar logo:', error);
      return { success: false, error: error.message };
    }
  };

  // Carregar dados do usuário do Firestore
  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  // Observar mudanças no estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserData(user.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    register,
    login,
    logout,
    updateUserPassword,
    updateUserName,
    updateUserLogo,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

