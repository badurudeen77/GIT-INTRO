import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "@/utils/ethereum";

interface BlockchainContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  contract: ethers.Contract | null;
  account: string | null;
  isConnected: boolean;
  userRole: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToGoerli: () => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextType>({
  provider: null,
  signer: null,
  contract: null,
  account: null,
  isConnected: false,
  userRole: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchToGoerli: async () => {},
});

interface BlockchainProviderProps {
  children: ReactNode;
}

export function BlockchainProvider({ children }: BlockchainProviderProps) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        // Check if on Goerli network
        const network = await provider.getNetwork();
        if (network.chainId !== 5n) {
          await switchToGoerli();
        }

        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        setProvider(provider);
        setSigner(signer);
        setContract(contract);
        setAccount(address);
        setIsConnected(true);

        // Try to get user role from contract or localStorage
        const storedRole = localStorage.getItem(`userRole_${address}`);
        setUserRole(storedRole || "customer");

        // Listen for account changes
        window.ethereum.on("accountsChanged", (accounts: string[]) => {
          if (accounts.length === 0) {
            disconnectWallet();
          } else {
            setAccount(accounts[0]);
          }
        });

        // Listen for network changes
        window.ethereum.on("chainChanged", () => {
          window.location.reload();
        });
      } catch (error) {
        console.error("Error connecting wallet:", error);
        throw error;
      }
    } else {
      throw new Error("MetaMask is not installed");
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount(null);
    setIsConnected(false);
    setUserRole(null);
  };

  const switchToGoerli = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x5" }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x5",
                chainName: "Goerli Testnet",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://goerli.infura.io/v3/"],
                blockExplorerUrls: ["https://goerli.etherscan.io"],
              },
            ],
          });
        }
        throw switchError;
      }
    }
  };

  // Auto-connect if previously connected
  useEffect(() => {
    const savedAccount = localStorage.getItem("connectedAccount");
    if (savedAccount && typeof window.ethereum !== "undefined") {
      connectWallet().catch(console.error);
    }
  }, []);

  // Save connected account
  useEffect(() => {
    if (account) {
      localStorage.setItem("connectedAccount", account);
    } else {
      localStorage.removeItem("connectedAccount");
    }
  }, [account]);

  const value = {
    provider,
    signer,
    contract,
    account,
    isConnected,
    userRole,
    connectWallet,
    disconnectWallet,
    switchToGoerli,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  }
  return context;
}

// HOC to wrap the App component
export function withBlockchain(Component: React.ComponentType) {
  return function BlockchainWrappedComponent(props: any) {
    return (
      <BlockchainProvider>
        <Component {...props} />
      </BlockchainProvider>
    );
  };
}
