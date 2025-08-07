import { type User, type InsertUser, type DrugBatch, type InsertDrugBatch, type SupplyChainEvent, type InsertSupplyChainEvent } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Drug batch methods
  getDrugBatches(limit?: number, offset?: number): Promise<DrugBatch[]>;
  getDrugBatchById(id: string): Promise<DrugBatch | undefined>;
  getDrugBatchByBatchId(batchId: string): Promise<DrugBatch | undefined>;
  getDrugBatchesByOwner(ownerAddress: string): Promise<DrugBatch[]>;
  createDrugBatch(drugBatch: InsertDrugBatch): Promise<DrugBatch>;
  updateDrugBatch(id: string, updates: Partial<DrugBatch>): Promise<DrugBatch>;

  // Supply chain event methods
  getSupplyChainEventsByBatchId(batchId: string): Promise<SupplyChainEvent[]>;
  createSupplyChainEvent(event: InsertSupplyChainEvent): Promise<SupplyChainEvent>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalBatches: number;
    activeTransfers: number;
    verifiedDrugs: number;
    gasUsed: string;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private drugBatches: Map<string, DrugBatch>;
  private supplyChainEvents: Map<string, SupplyChainEvent>;

  constructor() {
    this.users = new Map();
    this.drugBatches = new Map();
    this.supplyChainEvents = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "customer",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Drug batch methods
  async getDrugBatches(limit: number = 10, offset: number = 0): Promise<DrugBatch[]> {
    const allBatches = Array.from(this.drugBatches.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    
    return allBatches.slice(offset, offset + limit);
  }

  async getDrugBatchById(id: string): Promise<DrugBatch | undefined> {
    return this.drugBatches.get(id);
  }

  async getDrugBatchByBatchId(batchId: string): Promise<DrugBatch | undefined> {
    return Array.from(this.drugBatches.values()).find(
      (batch) => batch.batchId === batchId
    );
  }

  async getDrugBatchesByOwner(ownerAddress: string): Promise<DrugBatch[]> {
    return Array.from(this.drugBatches.values())
      .filter((batch) => batch.currentOwnerAddress.toLowerCase() === ownerAddress.toLowerCase())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createDrugBatch(insertDrugBatch: InsertDrugBatch): Promise<DrugBatch> {
    const id = randomUUID();
    const drugBatch: DrugBatch = {
      ...insertDrugBatch,
      id,
      manufacturingDate: new Date(insertDrugBatch.manufacturingDate),
      expiryDate: new Date(insertDrugBatch.expiryDate),
      status: insertDrugBatch.status || "manufactured",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.drugBatches.set(id, drugBatch);
    return drugBatch;
  }

  async updateDrugBatch(id: string, updates: Partial<DrugBatch>): Promise<DrugBatch> {
    const existing = this.drugBatches.get(id);
    if (!existing) {
      throw new Error("Drug batch not found");
    }

    const updated: DrugBatch = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.drugBatches.set(id, updated);
    return updated;
  }

  // Supply chain event methods
  async getSupplyChainEventsByBatchId(batchId: string): Promise<SupplyChainEvent[]> {
    return Array.from(this.supplyChainEvents.values())
      .filter((event) => event.batchId === batchId)
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
  }

  async createSupplyChainEvent(insertEvent: InsertSupplyChainEvent): Promise<SupplyChainEvent> {
    const id = randomUUID();
    const event: SupplyChainEvent = {
      ...insertEvent,
      id,
      fromOwner: insertEvent.fromOwner || null,
      fromOwnerAddress: insertEvent.fromOwnerAddress || null,
      transactionHash: insertEvent.transactionHash || null,
      blockNumber: insertEvent.blockNumber || null,
      timestamp: new Date(),
    };
    this.supplyChainEvents.set(id, event);
    return event;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalBatches: number;
    activeTransfers: number;
    verifiedDrugs: number;
    gasUsed: string;
  }> {
    const totalBatches = this.drugBatches.size;
    const activeTransfers = Array.from(this.drugBatches.values())
      .filter((batch) => batch.status === "in_transit").length;
    const verifiedDrugs = Array.from(this.drugBatches.values())
      .filter((batch) => batch.status !== "expired").length;
    
    return {
      totalBatches,
      activeTransfers,
      verifiedDrugs,
      gasUsed: "0.0234", // Mock value for gas usage
    };
  }
}

export const storage = new MemStorage();
