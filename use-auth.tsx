import { createContext, ReactNode, useContext, useState } from "react";
import { User, Locker } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { api, type LoginRequest, AuthResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  assignedLocker: Locker | null;
  login: (data: LoginRequest) => void;
  logout: () => void;
  isLoggingIn: boolean;
  refreshSession: (locker: Locker | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [assignedLocker, setAssignedLocker] = useState<Locker | null>(null);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      // Manual fetch because apiRequest helper in lib/queryClient might be too simple for custom response handling without throwing immediately on 401 if we want to handle it gracefully here
      // But we will use fetch directly to match the hook pattern requested
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid RFID or PIN");
        }
        throw new Error("Login failed");
      }

      // We need to parse this properly
      const json = await res.json();
      return api.auth.login.responses[200].parse(json);
    },
    onSuccess: (data: AuthResponse) => {
      setUser(data.user);
      setAssignedLocker(data.assignedLocker);
      toast({
        title: "Welcome back",
        description: `Logged in as ${data.user.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Access Denied",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    setUser(null);
    setAssignedLocker(null);
  };

  const refreshSession = (locker: Locker | null) => {
    setAssignedLocker(locker);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        assignedLocker,
        login: loginMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
