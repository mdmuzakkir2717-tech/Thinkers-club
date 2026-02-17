import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === AUTH ===
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { rfid, pin } = api.auth.login.input.parse(req.body);
      
      // Find user by RFID
      let user = await storage.getUserByRfid(rfid);
      
      // For this "fake" prototype, if user doesn't exist, maybe we create them?
      // Or we just strictly check. The prompt says "enter unique idd number provided for now make it a fake one and after that it aska pin code... let any pin be entered"
      // Interpretation: Auto-register or just accept any login if user exists.
      // Let's verify PIN if user exists, or create a new user if not (simulating "provided" ID).
      
      if (!user) {
        // Auto-create for prototype ease
        user = await storage.createUser(rfid, pin, `User ${rfid}`);
      } else {
        // Verify PIN (Simple equality check for prototype)
        if (user.pin !== pin) {
          // For the prompt "let any pin be entered", maybe we ignore mismatch?
          // But "after verifying it" implies verification.
          // Let's return error if mismatch to be realistic, but seeded user has 1234.
          // Or update the PIN to the new one?
          // Prompt: "let any pin be entered" -> implies we might not care about the PIN matching the DB?
          // Let's stick to standard auth behavior: check pin.
          if (user.pin !== pin) {
             return res.status(401).json({ message: "Invalid PIN" });
          }
        }
      }
      
      const assignedLocker = await storage.getLockerByOccupant(user.id);
      
      res.json({ user, assignedLocker: assignedLocker || null });
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // === LOCKERS ===
  app.get(api.lockers.list.path, async (req, res) => {
    const lockers = await storage.getLockers();
    res.json(lockers);
  });

  app.post(api.lockers.occupy.path, async (req, res) => {
    const lockerId = Number(req.params.id);
    const { userId } = req.body;

    const locker = await storage.getLocker(lockerId);
    if (!locker) return res.status(404).json({ message: "Locker not found" });
    if (locker.isOccupied) return res.status(400).json({ message: "Locker already occupied" });

    // Check if user already has a locker
    const existingLocker = await storage.getLockerByOccupant(userId);
    if (existingLocker) return res.status(400).json({ message: "User already has a locker" });

    const updated = await storage.occupyLocker(lockerId, userId);
    res.json(updated);
  });

  app.post(api.lockers.vacate.path, async (req, res) => {
    const lockerId = Number(req.params.id);
    const { userId } = req.body;

    const locker = await storage.getLocker(lockerId);
    if (!locker) return res.status(404).json({ message: "Locker not found" });
    
    // Verify ownership
    if (locker.occupantId !== userId) {
      return res.status(403).json({ message: "Not your locker" });
    }

    const updated = await storage.vacateLocker(lockerId);
    res.json(updated);
  });

  app.post(api.lockers.open.path, async (req, res) => {
    const lockerId = Number(req.params.id);
    const { userId } = req.body;

    const locker = await storage.getLocker(lockerId);
    if (!locker) return res.status(404).json({ message: "Locker not found" });

    // Verify ownership
    if (locker.occupantId !== userId) {
      return res.status(403).json({ message: "Not your locker" });
    }

    // In a real system, this would trigger hardware
    res.json({ success: true, message: `Locker ${locker.displayNumber} opened successfully` });
  });

  // SEED DATA on startup
  await storage.seedLockers();
  await storage.seedUsers();

  return httpServer;
}
