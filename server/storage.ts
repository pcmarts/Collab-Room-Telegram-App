import { users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.telegram_id === telegramId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = insertUser as User;
    this.users.set(user.id, user);
    return user;
  }
}

export const storage = new MemStorage();