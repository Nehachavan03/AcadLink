import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string; // email
  role: "STUDENT" | "FACULTY" | "ADMIN" | "PARENT";

  exp: number;
}

interface AuthUser {
  email: string;
  role: "STUDENT" | "FACULTY" | "ADMIN" | "PARENT";

  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback((token: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const authUser: AuthUser = {
        email: decoded.sub,
        role: decoded.role,
        token,
      };
      setUser(authUser);
      localStorage.setItem("acadlink_token", token);
    } catch {
      console.error("Invalid token");
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("acadlink_token");
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("acadlink_token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.exp * 1000 > Date.now()) {
          login(token);
        } else {
          localStorage.removeItem("acadlink_token");
        }
      } catch {
        localStorage.removeItem("acadlink_token");
      }
    }
  }, [login]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
