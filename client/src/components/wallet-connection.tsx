import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBlockchain } from "@/hooks/use-blockchain";
import { useToast } from "@/hooks/use-toast";

export function WalletConnection() {
  const { account, isConnected, connectWallet, disconnectWallet } = useBlockchain();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to MetaMask",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from MetaMask",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && account) {
    return (
      <div className="flex items-center space-x-2">
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-700 font-medium">
            {formatAddress(account)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="text-xs"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-primary text-white hover:bg-primary/90"
      size="sm"
    >
      {isConnecting ? (
        <>
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Connecting...
        </>
      ) : (
        <>
          <i className="fas fa-wallet mr-2"></i>
          Connect Wallet
        </>
      )}
    </Button>
  );
}
