import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SEOHead } from "@/components/seo/seo-head";
import { Loader2, Shield, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuthStatus {
  isAuthenticated: boolean;
  username: string | null;
}

interface LoginResponse {
  success: boolean;
  message: string;
  redirectTo?: string;
}

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if already authenticated
  const { data: authStatus } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    retry: false
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || "Login failed");
      }
      
      return await response.json() as LoginResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        // Force refresh auth status
        queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
        toast({
          title: "Login Successful",
          description: "Welcome to the admin panel",
        });
        // Add a small delay to ensure auth status is updated
        setTimeout(() => {
          setLocation(data.redirectTo || "/admin");
        }, 100);
      } else {
        setError(data.message);
      }
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      setError(error?.message || "Login failed. Please try again.");
    },
  });

  // Redirect if already authenticated (after all hooks are declared)
  if (authStatus?.isAuthenticated) {
    setLocation("/admin");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <>
      <SEOHead 
        title="Admin Login - MobilePrices.pk"
        description="Secure admin login for MobilePrices.pk management panel"
        canonical="/admin/login"
        noIndex={true}
      />
      
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Admin Login
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to access the MobilePrices.pk admin panel
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Authentication Required</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      disabled={loginMutation.isPending}
                      className="mt-1"
                      data-testid="input-username"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      disabled={loginMutation.isPending}
                      className="mt-1"
                      data-testid="input-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Default Credentials:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Username:</strong> admin</p>
                  <p><strong>Password:</strong> admin123</p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Note: These are temporary credentials for development.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Protected by secure session authentication
            </p>
          </div>
        </div>
      </div>
    </>
  );
}