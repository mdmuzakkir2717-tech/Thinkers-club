import { Locker, User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Lock, Unlock, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";

interface LockerCardProps {
  locker: Locker;
  currentUser: User;
  isUserAssignedLocker: boolean;
  onSelect: (locker: Locker) => void;
}

export function LockerCard({
  locker,
  currentUser,
  isUserAssignedLocker,
  onSelect,
}: LockerCardProps) {
  const isMine = locker.occupantId === currentUser.id;
  const isOccupiedByOther = locker.isOccupied && !isMine;
  const isAvailable = !locker.isOccupied;

  // Determine styles based on state
  const baseStyles =
    "relative h-32 w-full rounded-xl border p-4 flex flex-col justify-between transition-all duration-300 backdrop-blur-sm";
  
  let stateStyles = "";
  let icon = <Unlock className="w-5 h-5 opacity-50" />;
  let label = "Available";

  if (isAvailable) {
    stateStyles =
      "bg-green-500/5 border-green-500/20 text-green-400 hover:bg-green-500/10 hover:border-green-500/40 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)] cursor-pointer group";
    icon = <Unlock className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />;
  } else if (isMine) {
    stateStyles =
      "bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.15)] cursor-pointer hover:bg-blue-500/20 hover:border-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/30";
    icon = <Unlock className="w-6 h-6 text-blue-400 animate-pulse" />;
    label = "My Locker";
  } else if (isOccupiedByOther) {
    stateStyles = "bg-red-500/5 border-red-500/10 text-red-900/40 cursor-not-allowed opacity-60 grayscale-[0.5]";
    icon = <Lock className="w-5 h-5 text-red-900/40" />;
    label = "Occupied";
  }

  const handleClick = () => {
    if (isAvailable && isUserAssignedLocker) {
      // User already has a locker, can't take another
      return; 
    }
    if (isOccupiedByOther) return;
    onSelect(locker);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className={cn(baseStyles, stateStyles)}
    >
      <div className="flex justify-between items-start">
        <span className="font-display text-2xl font-bold tracking-wider">
          {String(locker.displayNumber).padStart(2, '0')}
        </span>
        {icon}
      </div>
      
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-widest opacity-60 font-mono">
          {locker.location}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {isMine ? <UserIcon className="w-3 h-3" /> : null}
          {label}
        </div>
      </div>

      {/* Glow effect for own locker */}
      {isMine && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-500/10 to-transparent pointer-events-none" />
      )}
    </motion.div>
  );
}
