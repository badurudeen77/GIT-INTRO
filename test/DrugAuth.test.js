const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DrugAuth", function () {
  let drugAuth;
  let owner, manufacturer, distributor, pharmacy, customer;
  let drugData;

  beforeEach(async function () {
    [owner, manufacturer, distributor, pharmacy, customer] = await ethers.getSigners();

    const DrugAuth = await ethers.getContractFactory("DrugAuth");
    drugAuth = await DrugAuth.deploy();
    await drugAuth.waitForDeployment();

    // Sample drug data
    drugData = {
      batchId: "BTC-2024-001",
      drugName: "Paracetamol 500mg",
      manufacturer: "PharmaCorp Ltd.",
      expiryDate: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year from now
      ipfsHash: "QmTestHash123456789",
    };
  });

  describe("Drug Registration", function () {
    it("Should register a new drug successfully", async function () {
      const tx = await drugAuth.registerDrug(
        drugData.batchId,
        drugData.drugName,
        drugData.manufacturer,
        drugData.expiryDate,
        drugData.ipfsHash
      );

      const receipt = await tx.wait();
      const tokenId = 1; // First token ID should be 1

      // Check if drug is registered correctly
      const drug = await drugAuth.verifyDrug(tokenId);
      expect(drug.batchId).to.equal(drugData.batchId);
      expect(drug.drugName).to.equal(drugData.drugName);
      expect(drug.manufacturer).to.equal(drugData.manufacturer);
      expect(drug.currentOwner).to.equal(owner.address);
      expect(drug.isActive).to.be.true;
    });

    it("Should emit DrugRegistered event", async function () {
      await expect(
        drugAuth.registerDrug(
          drugData.batchId,
          drugData.drugName,
          drugData.manufacturer,
          drugData.expiryDate,
          drugData.ipfsHash
        )
      )
        .to.emit(drugAuth, "DrugRegistered")
        .withArgs(1, drugData.batchId, owner.address, drugData.drugName, drugData.manufacturer);
    });

    it("Should fail with duplicate batch ID", async function () {
      await drugAuth.registerDrug(
        drugData.batchId,
        drugData.drugName,
        drugData.manufacturer,
        drugData.expiryDate,
        drugData.ipfsHash
      );

      await expect(
        drugAuth.registerDrug(
          drugData.batchId,
          "Another Drug",
          "Another Manufacturer",
          drugData.expiryDate,
          drugData.ipfsHash
        )
      ).to.be.revertedWith("Batch ID already exists");
    });

    it("Should fail with empty batch ID", async function () {
      await expect(
        drugAuth.registerDrug(
          "",
          drugData.drugName,
          drugData.manufacturer,
          drugData.expiryDate,
          drugData.ipfsHash
        )
      ).to.be.revertedWith("Batch ID cannot be empty");
    });

    it("Should fail with past expiry date", async function () {
      const pastDate = Math.floor(Date.now() / 1000) - 86400; // Yesterday

      await expect(
        drugAuth.registerDrug(
          drugData.batchId,
          drugData.drugName,
          drugData.manufacturer,
          pastDate,
          drugData.ipfsHash
        )
      ).to.be.revertedWith("Expiry date must be in the future");
    });
  });

  describe("Ownership Transfer", function () {
    let tokenId;

    beforeEach(async function () {
      const tx = await drugAuth.registerDrug(
        drugData.batchId,
        drugData.drugName,
        drugData.manufacturer,
        drugData.expiryDate,
        drugData.ipfsHash
      );
      tokenId = 1;
    });

    it("Should transfer ownership successfully", async function () {
      await drugAuth.transferOwnership(tokenId, manufacturer.address, "transfer");

      const newOwner = await drugAuth.ownerOf(tokenId);
      expect(newOwner).to.equal(manufacturer.address);

      const drug = await drugAuth.verifyDrug(tokenId);
      expect(drug.currentOwner).to.equal(manufacturer.address);
    });

    it("Should emit OwnershipTransferred event", async function () {
      await expect(drugAuth.transferOwnership(tokenId, manufacturer.address, "transfer"))
        .to.emit(drugAuth, "OwnershipTransferred")
        .withArgs(tokenId, owner.address, manufacturer.address, "transfer");
    });

    it("Should record transfer in drug history", async function () {
      await drugAuth.transferOwnership(tokenId, manufacturer.address, "transfer");

      const history = await drugAuth.getDrugHistory(tokenId);
      expect(history.length).to.equal(2); // manufacture + transfer
      expect(history[1].from).to.equal(owner.address);
      expect(history[1].to).to.equal(manufacturer.address);
      expect(history[1].eventType).to.equal("transfer");
    });

    it("Should fail when transferring to same owner", async function () {
      await expect(
        drugAuth.transferOwnership(tokenId, owner.address, "transfer")
      ).to.be.revertedWith("Cannot transfer to current owner");
    });

    it("Should fail when not token owner", async function () {
      await expect(
        drugAuth.connect(manufacturer).transferOwnership(tokenId, distributor.address, "transfer")
      ).to.be.revertedWith("Not the token owner");
    });
  });

  describe("Drug Verification", function () {
    let tokenId;

    beforeEach(async function () {
      await drugAuth.registerDrug(
        drugData.batchId,
        drugData.drugName,
        drugData.manufacturer,
        drugData.expiryDate,
        drugData.ipfsHash
      );
      tokenId = 1;
    });

    it("Should verify drug by token ID", async function () {
      const drug = await drugAuth.verifyDrug(tokenId);
      expect(drug.batchId).to.equal(drugData.batchId);
      expect(drug.drugName).to.equal(drugData.drugName);
      expect(drug.isActive).to.be.true;
    });

    it("Should verify drug by batch ID", async function () {
      const drug = await drugAuth.verifyDrugByBatchId(drugData.batchId);
      expect(drug.batchId).to.equal(drugData.batchId);
      expect(drug.drugName).to.equal(drugData.drugName);
    });

    it("Should fail for non-existent token", async function () {
      await expect(drugAuth.verifyDrug(999)).to.be.revertedWith("Drug does not exist");
    });

    it("Should fail for non-existent batch ID", async function () {
      await expect(drugAuth.verifyDrugByBatchId("INVALID-BATCH")).to.be.revertedWith(
        "Batch ID does not exist"
      );
    });
  });

  describe("Drug History", function () {
    let tokenId;

    beforeEach(async function () {
      await drugAuth.registerDrug(
        drugData.batchId,
        drugData.drugName,
        drugData.manufacturer,
        drugData.expiryDate,
        drugData.ipfsHash
      );
      tokenId = 1;
    });

    it("Should track manufacturing event", async function () {
      const history = await drugAuth.getDrugHistory(tokenId);
      expect(history.length).to.equal(1);
      expect(history[0].from).to.equal(ethers.ZeroAddress);
      expect(history[0].to).to.equal(owner.address);
      expect(history[0].eventType).to.equal("manufacture");
    });

    it("Should track multiple transfers", async function () {
      await drugAuth.transferOwnership(tokenId, manufacturer.address, "transfer");
      await drugAuth.connect(manufacturer).transferOwnership(tokenId, distributor.address, "distribute");

      const history = await drugAuth.getDrugHistory(tokenId);
      expect(history.length).to.equal(3);
      expect(history[2].eventType).to.equal("distribute");
    });
  });

  describe("Role Management", function () {
    it("Should assign roles correctly", async function () {
      await drugAuth.assignRole(manufacturer.address, "manufacturer");
      const role = await drugAuth.getUserRole(manufacturer.address);
      expect(role).to.equal("manufacturer");
    });

    it("Should emit RoleAssigned event", async function () {
      await expect(drugAuth.assignRole(manufacturer.address, "manufacturer"))
        .to.emit(drugAuth, "RoleAssigned")
        .withArgs(manufacturer.address, "manufacturer");
    });

    it("Should fail when non-owner assigns roles", async function () {
      await expect(
        drugAuth.connect(manufacturer).assignRole(distributor.address, "distributor")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Utility Functions", function () {
    it("Should return total drugs count", async function () {
      expect(await drugAuth.totalDrugs()).to.equal(0);

      await drugAuth.registerDrug(
        drugData.batchId,
        drugData.drugName,
        drugData.manufacturer,
        drugData.expiryDate,
        drugData.ipfsHash
      );

      expect(await drugAuth.totalDrugs()).to.equal(1);
    });

    it("Should return drugs by owner", async function () {
      await drugAuth.registerDrug(
        drugData.batchId,
        drugData.drugName,
        drugData.manufacturer,
        drugData.expiryDate,
        drugData.ipfsHash
      );

      const drugs = await drugAuth.getDrugsByOwner(owner.address);
      expect(drugs.length).to.equal(1);
      expect(drugs[0]).to.equal(1);
    });

    it("Should deactivate drug", async function () {
      await drugAuth.registerDrug(
        drugData.batchId,
        drugData.drugName,
        drugData.manufacturer,
        drugData.expiryDate,
        drugData.ipfsHash
      );

      await drugAuth.deactivateDrug(1);
      const drug = await drugAuth.verifyDrug(1);
      expect(drug.isActive).to.be.false;
    });
  });
});
