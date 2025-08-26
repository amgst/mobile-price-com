import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface AuthStatus {
  isAuthenticated: boolean;
  username: string | null;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: authStatus, isLoading } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    retry: false,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/auth/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/status"], {
        isAuthenticated: false,
        username: null,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      setLocation("/admin/login");
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    isAuthenticated: authStatus?.isAuthenticated || false,
    username: authStatus?.username,
    isLoading,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}