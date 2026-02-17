import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Brain, ArrowRight, Scan, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Home() {
  const [rfid, setRfid] = useState("");
  const [pin, setPin] = useState("");
  const { login, isLoggingIn, user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ rfid, pin });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4 border border-primary/20 shadow-[0_0_30px_rgba(56,189,248,0.1)] backdrop-blur-sm">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white glow-text font-display">
            THINKER'S CLUB
          </h1>
          <p className="text-muted-foreground font-light tracking-widest uppercase text-sm">
            Secure Locker System v2.0
          </p>
        </div>

        <Card className="glass-panel border-white/5">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-xl">Authentication Required</CardTitle>
            <CardDescription>
              Scan RFID or enter your unique ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Scan className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="RFID / Unique ID"
                      value={rfid}
                      onChange={(e) => setRfid(e.target.value)}
                      className="pl-10 h-12 bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 text-lg font-mono tracking-wider transition-all"
                      disabled={isLoggingIn}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="PIN Code"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="pl-10 h-12 bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 text-lg font-mono tracking-wider transition-all"
                      disabled={isLoggingIn}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoggingIn || !rfid || !pin}
              >
                {isLoggingIn ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Access System <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/50 font-mono">
            SYSTEM STATUS: ONLINE • SECURE CONNECTION ESTABLISHED
          </p>
        </div>
      </motion.div>
    </div>
  );
}
