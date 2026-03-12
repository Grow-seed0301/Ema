import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Users, Calendar, Star, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const { toast } = useToast();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Education App</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                Admin Dashboard for Education Platform
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage users, teachers, lessons, payments, and subscription plans all in one place.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="rounded-full bg-primary/10 p-2 w-fit">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">User Management</CardTitle>
                  <CardDescription className="text-sm">
                    Manage student and teacher accounts
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="rounded-full bg-primary/10 p-2 w-fit">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">Teacher Profiles</CardTitle>
                  <CardDescription className="text-sm">
                    Track teacher performance and ratings
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="rounded-full bg-primary/10 p-2 w-fit">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">Lesson Scheduling</CardTitle>
                  <CardDescription className="text-sm">
                    Manage bookings and schedules
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="rounded-full bg-primary/10 p-2 w-fit">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">Subscription Plans</CardTitle>
                  <CardDescription className="text-sm">
                    Configure subscription packages
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>Sign in to access the admin dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      data-testid="input-login-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      data-testid="input-login-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
