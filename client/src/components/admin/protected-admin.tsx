import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, LogOut, User } from "lucide-react";

interface ProtectedAdminProps {
  children: React.ReactNode;
}

export function ProtectedAdmin({ children }: ProtectedAdminProps) {
  const { isAuthenticated, username, isLoading, logout, isLoggingOut } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Add a small delay to prevent redirect loops
      const timer = setTimeout(() => {
        setLocation("/admin/login");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You need to log in to access the admin panel.
            </p>
            <Button onClick={() => setLocation("/admin/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">
                MobilePrices.pk Admin
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{username}</span>
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                disabled={isLoggingOut}
                data-testid="button-logout"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}