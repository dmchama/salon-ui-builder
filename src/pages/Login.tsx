import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { loginRequest } from "@/api/auth-api";
import { setAuth } from "@/lib/auth-storage";
import { ApiError } from "@/api/http";

function safeRedirect(raw: string | null): string | undefined {
  if (!raw?.startsWith("/") || raw.startsWith("//")) return undefined;
  return raw;
}

const Login = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = safeRedirect(params.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const { accessToken, user } = await loginRequest(email.trim(), password);
      setAuth(accessToken, user);
      toast.success("Welcome back!");

      if (redirectTo) {
        navigate(redirectTo, { replace: true });
        return;
      }

      if (user.role === "SUPER_ADMIN") {
        navigate("/admin", { replace: true });
        return;
      }
      if (user.role === "SALON_ADMIN") {
        navigate("/dashboard", { replace: true });
        return;
      }
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Sign in failed.";
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="font-display text-2xl">Welcome Back</CardTitle>
            <p className="text-sm text-muted-foreground">
              Super admin: website tools. Salon admin: your business dashboard.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Run a salon?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Salon admin signup
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
