const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get the ContractFactory and Signers
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy the DrugAuth contract
  console.log("Deploying DrugAuth contract...");
  const DrugAuth = await hre.ethers.getContractFactory("DrugAuth");
  const drugAuth = await DrugAuth.deploy();

  await drugAuth.waitForDeployment();
  const contractAddress = await drugAuth.getAddress();

  console.log("DrugAuth contract deployed to:", contractAddress);

  // Verify contract on Etherscan (optional)
  if (hre.network.name === "goerli") {
    console.log("Waiting for block confirmations...");
    await drugAuth.deploymentTransaction().wait(5);

    try {
      console.log("Verifying contract on Etherscan...");
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Error verifying contract:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: drugAuth.deploymentTransaction().hash,
  };

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", deploymentInfo.network);
  console.log("Contract Address:", deploymentInfo.contractAddress);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Transaction Hash:", deploymentInfo.transactionHash);
  console.log("Deployment Time:", deploymentInfo.deploymentTime);

  console.log("\n=== Environment Variables ===");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);

  return deploymentInfo;
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
