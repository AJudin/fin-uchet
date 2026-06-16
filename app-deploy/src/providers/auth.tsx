import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { trpc } from "@/providers/trpc";

type User = {
  id: number;
  login: string;
  name: string;
  role: "operator" | "admin";
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    enabled: !!localStorage.getItem("token"),
  });

  useEffect(() => {
    if (!meQuery.isLoading) {
      if (meQuery.data) {
        setUser(meQuery.data);
      }
      setIsLoading(false);
    }
  }, [meQuery.data, meQuery.isLoading]);

  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    setUser(userData);
    utils.invalidate();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
