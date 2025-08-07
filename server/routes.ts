import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDrugBatchSchema, insertSupplyChainEventSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Drug batch routes
  app.get("/api/drug-batches", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const batches = await storage.getDrugBatches(limit, offset);
      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.get("/api/drug-batches/owned/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const batches = await storage.getDrugBatchesByOwner(address);
      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.get("/api/drug-batches/verify/:batchId", async (req, res) => {
    try {
      const { batchId } = req.params;
      const decodedBatchId = decodeURIComponent(batchId);
      
      const drug = await storage.getDrugBatchByBatchId(decodedBatchId);
      if (!drug) {
        return res.status(404).json({ message: "Drug batch not found" });
      }

      const events = await storage.getSupplyChainEventsByBatchId(decodedBatchId);
      res.json({ drug, events });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.get("/api/drug-batches/track/:batchId", async (req, res) => {
    try {
      const { batchId } = req.params;
      const decodedBatchId = decodeURIComponent(batchId);
      
      const drug = await storage.getDrugBatchByBatchId(decodedBatchId);
      if (!drug) {
        return res.status(404).json({ message: "Drug batch not found" });
      }

      const events = await storage.getSupplyChainEventsByBatchId(decodedBatchId);
      res.json({ drug, events });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.get("/api/drug-batches/history/:batchId", async (req, res) => {
    try {
      const { batchId } = req.params;
      const decodedBatchId = decodeURIComponent(batchId);
      
      const events = await storage.getSupplyChainEventsByBatchId(decodedBatchId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.post("/api/drug-batches", async (req, res) => {
    try {
      const validatedData = insertDrugBatchSchema.parse(req.body);
      const drugBatch = await storage.createDrugBatch(validatedData);
      
      // Create initial manufacturing event
      const manufacturingEvent = await storage.createSupplyChainEvent({
        batchId: drugBatch.batchId,
        toOwner: drugBatch.currentOwner,
        toOwnerAddress: drugBatch.currentOwnerAddress,
        eventType: "manufacture",
      });

      res.status(201).json({ drugBatch, event: manufacturingEvent });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.post("/api/drug-batches/transfer", async (req, res) => {
    try {
      const { batchId, newOwner, newOwnerAddress, eventType, transactionHash } = req.body;
      
      if (!batchId || !newOwner || !newOwnerAddress || !eventType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get current drug batch
      const currentDrug = await storage.getDrugBatchByBatchId(batchId);
      if (!currentDrug) {
        return res.status(404).json({ message: "Drug batch not found" });
      }

      // Update drug batch ownership
      const updatedDrug = await storage.updateDrugBatch(currentDrug.id, {
        currentOwner: newOwner,
        currentOwnerAddress: newOwnerAddress,
        status: eventType === "deliver" ? "delivered" : "in_transit",
        updatedAt: new Date(),
      });

      // Create transfer event
      const transferEvent = await storage.createSupplyChainEvent({
        batchId,
        fromOwner: currentDrug.currentOwner,
        toOwner: newOwner,
        fromOwnerAddress: currentDrug.currentOwnerAddress,
        toOwnerAddress: newOwnerAddress,
        eventType,
        transactionHash,
      });

      res.json({ drugBatch: updatedDrug, event: transferEvent });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
