import { pgTable, text, serial, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  rfid: text("rfid").notNull().unique(), // The "unique idd number"
  pin: text("pin").notNull(),            // The pin code
  name: text("name").notNull(),
});

export const lockers = pgTable("lockers", {
  id: serial("id").primaryKey(),
  displayNumber: integer("display_number").notNull().unique(),
  isOccupied: boolean("is_occupied").default(false).notNull(),
  occupantId: integer("occupant_id").references(() => users.id), // Nullable, set when occupied
  location: text("location").notNull(), // e.g., "Row 1, Col 1"
});

// === BASE SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertLockerSchema = createInsertSchema(lockers).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===
export type User = typeof users.$inferSelect;
export type Locker = typeof lockers.$inferSelect;

// Request types
export type LoginRequest = { rfid: string; pin: string };
export type OccupyLockerRequest = { userId: number };
export type VacateLockerRequest = { userId: number }; // User vacating their locker

// Response types
export type AuthResponse = { user: User; assignedLocker: Locker | null };
export type LockerResponse = Locker;
export type LockersListResponse = Locker[];
