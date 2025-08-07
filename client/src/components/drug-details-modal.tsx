import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useIPFS } from "@/hooks/use-ipfs";
import { useToast } from "@/hooks/use-toast";
import { downloadQRCode, createDrugQRData, generateQRCode } from "@/utils/qr-code";
import { apiRequest } from "@/lib/queryClient";

interface DrugBatch {
  id: string;
  batchId: string;
  drugName: string;
  manufacturer: string;
  manufacturingDate: string;
  expiryDate: string;
  currentOwner: string;
  currentOwnerAddress: string;
  status: string;
  ipfsHash?: string;
  contractAddress?: string;
  tokenId?: string;
  createdAt: string;
}

interface SupplyChainEvent {
  id: string;
  fromOwner?: string;
  toOwner: string;
  fromOwnerAddress?: string;
  toOwnerAddress: string;
  eventType: string;
  transactionHash?: string;
  timestamp: string;
}

interface DrugDetailsModalProps {
  drug: DrugBatch;
  isOpen: boolean;
  onClose: () => void;
}

export function DrugDetailsModal({ drug, isOpen, onClose }: DrugDetailsModalProps) {
  const { retrieveFile } = useIPFS();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string>("");
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  // Fetch supply chain history for this drug
  const { data: supplyChainEvents, isLoading: eventsLoading } = useQuery<SupplyChainEvent[]>({
    queryKey: ["/api/drug-batches/history", drug.batchId],
    enabled: isOpen && !!drug.batchId,
  });

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && drug) {
      const generateQR = async () => {
        try {
          const qrData = createDrugQRData(drug.batchId, drug.tokenId);
          const qrDataUrl = await generateQRCode(qrData);
          setQrCode(qrDataUrl);
        } catch (error) {
          console.error("Failed to generate QR code:", error);
        }
      };

      generateQR();

      // Retrieve certificate from IPFS if available
      if (drug.ipfsHash) {
        retrieveFile(drug.ipfsHash)
          .then((url) => setCertificateUrl(url))
          .catch((error) => console.error("Failed to retrieve certificate:", error));
      }
    }
  }, [isOpen, drug, retrieveFile]);

  const handleDownloadQR = async () => {
    try {
      await downloadQRCode(createDrugQRData(drug.batchId, drug.tokenId), `DrugAuth-${drug.batchId}`);
      toast({
        title: "QR Code Downloaded",
        description: `QR code for batch ${drug.batchId} has been downloaded`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "default";
      case "in_transit":
        return "secondary";
      case "manufactured":
        return "outline";
      case "expired":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case "manufacture":
        return "fas fa-industry";
      case "transfer":
        return "fas fa-truck";
      case "distribute":
        return "fas fa-warehouse";
      case "deliver":
        return "fas fa-store";
      case "verify":
        return "fas fa-shield-check";
      default:
        return "fas fa-arrow-right";
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case "manufacture":
        return "bg-green-500";
      case "transfer":
        return "bg-amber-500";
      case "distribute":
        return "bg-blue-500";
      case "deliver":
        return "bg-purple-500";
      case "verify":
        return "bg-secondary";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Drug Batch Details</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <i className="fas fa-times text-xl"></i>
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Drug Information */}
          <div>
            <h3 className="text-lg font-semibold text-neutral mb-4">Drug Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Batch ID</label>
                <p className="font-mono text-neutral bg-gray-50 px-3 py-2 rounded-md">
                  {drug.batchId}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Drug Name</label>
                <p className="text-neutral font-medium">{drug.drugName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Manufacturer</label>
                <p className="text-neutral">{drug.manufacturer}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Manufacturing Date</label>
                  <p className="text-neutral">
                    {new Date(drug.manufacturingDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Expiry Date</label>
                  <p className="text-neutral">
                    {new Date(drug.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Current Status</label>
                <Badge variant={getStatusBadgeVariant(drug.status)}>
                  {formatStatus(drug.status)}
                </Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Current Owner</label>
                <p className="text-neutral">{drug.currentOwner}</p>
                <p className="text-xs text-gray-500 font-mono break-all mt-1">
                  {drug.currentOwnerAddress}
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div className="mt-6 p-4 border border-gray-200 rounded-lg text-center">
              <h4 className="font-medium text-neutral mb-3">QR Code</h4>
              <div className="w-32 h-32 mx-auto flex items-center justify-center bg-white border rounded-lg">
                {qrCode ? (
                  <img src={qrCode} alt="QR Code" className="w-full h-full" />
                ) : (
                  <i className="fas fa-qrcode text-4xl text-gray-400"></i>
                )}
              </div>
              <Button
                onClick={handleDownloadQR}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <i className="fas fa-download mr-2"></i>
                Download QR Code
              </Button>
            </div>
          </div>

          {/* Supply Chain History */}
          <div>
            <h3 className="text-lg font-semibold text-neutral mb-4">Supply Chain History</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {eventsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : supplyChainEvents && supplyChainEvents.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-4">
                    {supplyChainEvents.map((event, index) => (
                      <div key={event.id} className="relative flex items-start space-x-4">
                        <div className={`w-8 h-8 ${getEventColor(event.eventType)} rounded-full flex items-center justify-center relative z-10`}>
                          <i className={`${getEventIcon(event.eventType)} text-white text-xs`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-neutral capitalize">
                              {event.eventType.replace("_", " ")}
                            </p>
                            <span className="text-sm text-gray-600">
                              {new Date(event.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {event.fromOwner ? (
                              <p>{event.fromOwner} → {event.toOwner}</p>
                            ) : (
                              <p>{event.toOwner}</p>
                            )}
                          </div>
                          {event.transactionHash && (
                            <div className="mt-1">
                              <a
                                href={`https://goerli.etherscan.io/tx/${event.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:text-primary/80"
                              >
                                Tx: {event.transactionHash.slice(0, 10)}...{event.transactionHash.slice(-8)}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-history text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">No supply chain history available</p>
                </div>
              )}
            </div>

            {/* IPFS Certificate Link */}
            {certificateUrl && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Certificate & Documents</h4>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-file-alt text-blue-600"></i>
                  <a
                    href={certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Certificate (IPFS)
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
