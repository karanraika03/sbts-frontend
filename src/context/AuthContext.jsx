import { createContext, useContext, useState } from "react";
import {
  createAuthSession,
  getAuthSession,
  clearAuthSession,
} from "../auth/session";
import { login as loginApi } from "../services/AuthService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getAuthSession);

  const login = async (userName, password, remember = true) => {
    const response = await loginApi(userName, password);

    if (!response?.token) {
      throw new Error(response?.message || "Login failed");
    }

    const authSession = createAuthSession(response.token, remember);

    setSession(authSession);

    return {
      ...response,
      user: authSession.user,
    };
  };

  const logout = () => {
    clearAuthSession();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        token: session?.token || null,
        isAuthed: !!session,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
