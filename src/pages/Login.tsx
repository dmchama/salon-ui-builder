import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Glass card */}
          <div className="bg-white rounded-3xl shadow-elevated p-8 space-y-7">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto shadow-soft">
                <Scissors className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">
                  Welcome Back
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Sign in to access your dashboard
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 tracking-wide block">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="rounded-xl border-0 bg-gray-100 h-12 px-4 text-sm text-gray-900 focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-0 placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 tracking-wide block">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="rounded-xl border-0 bg-gray-100 h-12 px-4 text-sm text-gray-900 focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-0 placeholder:text-gray-400"
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl h-12 bg-gold hover:bg-gold/90 text-white font-semibold text-sm transition-all duration-200 mt-1"
                disabled={pending}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            {/* Footer link */}
            <p className="text-sm text-gray-500 text-center">
              Run a salon?{" "}
              <Link to="/register" className="text-gold font-semibold hover:underline underline-offset-2">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
