import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors } from "lucide-react";
import Navbar from "@/components/Navbar";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrate auth
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
            <p className="text-sm text-muted-foreground">Sign in to manage your salon</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full">Sign In</Button>
            </form>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
