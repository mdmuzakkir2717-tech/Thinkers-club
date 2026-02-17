import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Locker } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useLockers() {
  return useQuery({
    queryKey: [api.lockers.list.path],
    queryFn: async () => {
      const res = await fetch(api.lockers.list.path);
      if (!res.ok) throw new Error("Failed to fetch lockers");
      return api.lockers.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Poll every 5 seconds to see updates from other users
  });
}

export function useOccupyLocker() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: number; userId: number }) => {
      const url = buildUrl(api.lockers.occupy.path, { id });
      const res = await fetch(url, {
        method: api.lockers.occupy.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to occupy locker");
      }
      return api.lockers.occupy.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.lockers.list.path] });
      toast({
        title: "Locker Secured",
        description: `You have occupied Locker #${data.displayNumber}`,
        className: "bg-green-500/10 border-green-500/20 text-green-500",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useVacateLocker() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: number; userId: number }) => {
      const url = buildUrl(api.lockers.vacate.path, { id });
      const res = await fetch(url, {
        method: api.lockers.vacate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to vacate locker");
      }
      return api.lockers.vacate.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.lockers.list.path] });
      toast({
        title: "Locker Vacated",
        description: `Locker #${data.displayNumber} is now available.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useOpenLocker() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: number; userId: number }) => {
      const url = buildUrl(api.lockers.open.path, { id });
      const res = await fetch(url, {
        method: api.lockers.open.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to open locker");
      }
      return api.lockers.open.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Visual feedback handled in component usually, but good to have here
    },
    onError: (error: Error) => {
      toast({
        title: "Access Denied",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
