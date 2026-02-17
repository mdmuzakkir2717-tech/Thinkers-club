import { db } from "./db";
import { lockers, users, type User, type Locker, type LoginRequest } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserByRfid(rfid: string): Promise<User | undefined>;
  createUser(rfid: string, pin: string, name: string): Promise<User>;
  getUser(id: number): Promise<User | undefined>;

  // Lockers
  getLockers(): Promise<Locker[]>;
  getLocker(id: number): Promise<Locker | undefined>;
  getLockerByOccupant(userId: number): Promise<Locker | undefined>;
  occupyLocker(lockerId: number, userId: number): Promise<Locker>;
  vacateLocker(lockerId: number): Promise<Locker>;
  
  // Seed
  seedLockers(): Promise<void>;
  seedUsers(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUserByRfid(rfid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.rfid, rfid));
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(rfid: string, pin: string, name: string): Promise<User> {
    const [user] = await db.insert(users).values({ rfid, pin, name }).returning();
    return user;
  }

  async getLockers(): Promise<Locker[]> {
    return await db.select().from(lockers).orderBy(lockers.displayNumber);
  }

  async getLocker(id: number): Promise<Locker | undefined> {
    const [locker] = await db.select().from(lockers).where(eq(lockers.id, id));
    return locker;
  }

  async getLockerByOccupant(userId: number): Promise<Locker | undefined> {
    const [locker] = await db.select().from(lockers).where(eq(lockers.occupantId, userId));
    return locker;
  }

  async occupyLocker(lockerId: number, userId: number): Promise<Locker> {
    const [updated] = await db
      .update(lockers)
      .set({ isOccupied: true, occupantId: userId })
      .where(eq(lockers.id, lockerId))
      .returning();
    return updated;
  }

  async vacateLocker(lockerId: number): Promise<Locker> {
    const [updated] = await db
      .update(lockers)
      .set({ isOccupied: false, occupantId: null })
      .where(eq(lockers.id, lockerId))
      .returning();
    return updated;
  }

  async seedLockers(): Promise<void> {
    const existing = await this.getLockers();
    if (existing.length === 0) {
      const newLockers = [];
      for (let i = 1; i <= 50; i++) {
        newLockers.push({
          displayNumber: i,
          location: `Row ${Math.ceil(i / 10)}, Col ${(i - 1) % 10 + 1}`,
          isOccupied: false,
          occupantId: null
        });
      }
      await db.insert(lockers).values(newLockers);
    }
  }
  
  async seedUsers(): Promise<void> {
    // Create a demo user if none exist
    const existing = await db.select().from(users).limit(1);
    if (existing.length === 0) {
      await this.createUser("12345", "1234", "Demo User");
      await this.createUser("admin", "admin", "Admin User");
    }
  }
}

export const storage = new DatabaseStorage();
