import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useLockers, useOccupyLocker, useVacateLocker, useOpenLocker } from "@/hooks/use-lockers";
import { Locker } from "@shared/schema";
import { LockerCard } from "@/components/LockerCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogOut, User, Box, Unlock, Lock, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, logout, refreshSession } = useAuth();
  const [, setLocation] = useLocation();
  const { data: lockers, isLoading } = useLockers();
  const occupyMutation = useOccupyLocker();
  const vacateMutation = useVacateLocker();
  const openMutation = useOpenLocker();
  const { toast } = useToast();

  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [showOccupyDialog, setShowOccupyDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [isAnimatingDoor, setIsAnimatingDoor] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Find user's assigned locker from the fresh data
  const userLocker = lockers?.find((l) => l.occupantId === user?.id) || null;

  // Sync auth context with latest data
  useEffect(() => {
    refreshSession(userLocker);
  }, [userLocker, refreshSession]);

  if (!user) return null;

  const handleLockerSelect = (locker: Locker) => {
    setSelectedLocker(locker);
    if (locker.occupantId === user.id) {
      setShowManageDialog(true);
    } else if (!locker.isOccupied) {
      if (userLocker) {
        toast({
          title: "Limit Reached",
          description: "You already have a locker assigned. Please vacate it first.",
          variant: "destructive",
        });
      } else {
        setShowOccupyDialog(true);
      }
    }
  };

  const handleOccupy = () => {
    if (!selectedLocker) return;
    occupyMutation.mutate(
      { id: selectedLocker.id, userId: user.id },
      {
        onSuccess: () => setShowOccupyDialog(false),
      }
    );
  };

  const handleVacate = () => {
    if (!selectedLocker) return;
    vacateMutation.mutate(
      { id: selectedLocker.id, userId: user.id },
      {
        onSuccess: () => setShowManageDialog(false),
      }
    );
  };

  const handleOpen = () => {
    if (!selectedLocker) return;
    openMutation.mutate(
      { id: selectedLocker.id, userId: user.id },
      {
        onSuccess: () => {
          setIsAnimatingDoor(true);
          setTimeout(() => setIsAnimatingDoor(false), 2000); // Reset animation after 2s
          toast({
            title: "Access Granted",
            description: `Locker #${selectedLocker.displayNumber} opened successfully.`,
            className: "bg-blue-500/10 border-blue-500/20 text-blue-500",
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
              <Box className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-lg tracking-wide hidden sm:inline-block">
              LOCKER ROOM
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-secondary/50 border border-white/5">
              <User className="w-4 h-4 text-muted-foreground" />
              <div className="flex flex-col text-right sm:flex-row sm:gap-2 sm:items-baseline">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground font-mono">ID: {user.rfid}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Status Bar */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-white mb-1">
              {userLocker ? (
                <span className="text-blue-400">Your Locker: #{userLocker.displayNumber}</span>
              ) : (
                "Select a Locker"
              )}
            </h2>
            <p className="text-muted-foreground">
              {userLocker
                ? "Manage your secure storage unit below."
                : "Choose an available green locker to secure your items."}
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <span>Yours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-900/50" />
              <span className="opacity-50">Occupied</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="w-full h-96 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 pb-20">
            <AnimatePresence>
              {lockers?.map((locker) => (
                <LockerCard
                  key={locker.id}
                  locker={locker}
                  currentUser={user}
                  isUserAssignedLocker={!!userLocker}
                  onSelect={handleLockerSelect}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Occupy Dialog */}
      <Dialog open={showOccupyDialog} onOpenChange={setShowOccupyDialog}>
        <DialogContent className="glass-panel border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide flex items-center gap-2">
              <Box className="w-5 h-5 text-primary" />
              Confirm Assignment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to occupy Locker #{selectedLocker?.displayNumber}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-white/5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Locker Number</span>
                <span className="font-mono font-bold text-lg">#{selectedLocker?.displayNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Location</span>
                <span className="font-mono">{selectedLocker?.location}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowOccupyDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleOccupy} 
              disabled={occupyMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {occupyMutation.isPending ? "Assigning..." : "Confirm & Occupy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Dialog (Open/Vacate) */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="glass-panel border-blue-500/20 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide text-blue-400 flex items-center gap-2">
              <Box className="w-5 h-5" />
              Manage Locker #{selectedLocker?.displayNumber}
            </DialogTitle>
            <DialogDescription>
              Control access to your assigned storage unit.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 flex flex-col items-center gap-6">
             {/* Visual Door Animation Placeholder */}
             <div className="relative w-32 h-32 flex items-center justify-center">
                <motion.div 
                  animate={isAnimatingDoor ? { rotateY: 100, x: 20 } : { rotateY: 0, x: 0 }}
                  transition={{ duration: 0.8, type: "spring" }}
                  style={{ transformOrigin: "right center", perspective: "1000px" }}
                  className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded-xl flex items-center justify-center z-10 backdrop-blur-md"
                >
                  <span className="font-display text-4xl font-bold text-blue-200">
                    {selectedLocker?.displayNumber}
                  </span>
                </motion.div>
                {/* Inside of locker */}
                <div className="absolute inset-0 bg-black/50 rounded-xl border border-white/5 flex items-center justify-center -z-0">
                  <div className="w-20 h-1 bg-white/10 rounded-full" />
                </div>
             </div>

             <div className="w-full grid grid-cols-1 gap-3">
                <Button 
                  onClick={handleOpen} 
                  className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                  disabled={openMutation.isPending || isAnimatingDoor}
                >
                  {openMutation.isPending ? "Opening..." : (
                    <span className="flex items-center gap-2">
                      <Unlock className="w-5 h-5" /> OPEN LOCKER
                    </span>
                  )}
                </Button>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                   <Button 
                      variant="outline" 
                      onClick={() => setShowManageDialog(false)}
                      className="border-white/10 hover:bg-white/5"
                   >
                     Close & Keep
                   </Button>
                   <Button 
                      variant="destructive" 
                      onClick={handleVacate}
                      disabled={vacateMutation.isPending}
                      className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                   >
                     {vacateMutation.isPending ? "Vacating..." : "Vacate & Release"}
                   </Button>
                </div>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
