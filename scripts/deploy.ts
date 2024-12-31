const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");
  
  const [deployer] = await hre.ethers.getSigners();
  const GameDay = await hre.ethers.getContractFactory("GameDay");
  console.log("Contract factory created");
  
  const gameDay = await GameDay.deploy();
  console.log("Contract deployment initiated");
  
  await gameDay.waitForDeployment();
  const address = await gameDay.getAddress();
  
  console.log("GameDay deployed to:", address);
  console.log("Deployment complete!");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
}); 