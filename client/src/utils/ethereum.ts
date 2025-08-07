// Smart contract ABI (simplified for example)
export const contractABI = [
  "function registerDrug(string memory batchId, string memory drugName, string memory manufacturer, uint256 expiryDate, string memory ipfsHash) public returns (uint256)",
  "function transferOwnership(uint256 tokenId, address to) public",
  "function verifyDrug(uint256 tokenId) public view returns (tuple(string batchId, string drugName, string manufacturer, uint256 expiryDate, string ipfsHash, address currentOwner, uint256 timestamp))",
  "function getDrugHistory(uint256 tokenId) public view returns (tuple(address from, address to, uint256 timestamp)[])",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)",
  "function balanceOf(address owner) public view returns (uint256)",
  "event DrugRegistered(uint256 indexed tokenId, string batchId, address indexed owner)",
  "event OwnershipTransferred(uint256 indexed tokenId, address indexed from, address indexed to)",
];

// Contract address on Goerli testnet (replace with actual deployed address)
export const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x1234567890123456789012345678901234567890";

// Ethereum utility functions
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTokenAmount = (amount: string, decimals: number = 18): string => {
  const value = parseFloat(amount);
  return (value / Math.pow(10, decimals)).toFixed(4);
};

export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Network configuration
export const GOERLI_NETWORK = {
  chainId: "0x5",
  chainName: "Goerli Testnet",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://goerli.infura.io/v3/"],
  blockExplorerUrls: ["https://goerli.etherscan.io"],
};

// Gas estimation helpers
export const estimateGas = {
  registerDrug: "200000",
  transferOwnership: "100000",
  verifyDrug: "50000",
};
