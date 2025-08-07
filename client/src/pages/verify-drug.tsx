import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlockchain } from "@/hooks/use-blockchain";
import { useIPFS } from "@/hooks/use-ipfs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { downloadQRCode, createDrugQRData } from "@/utils/qr-code";
import { apiRequest } from "@/lib/queryClient";

const verificationSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
});

type VerificationData = z.infer<typeof verificationSchema>;

interface DrugDetails {
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

export default function VerifyDrug() {
  const { contract, isConnected } = useBlockchain();
  const { retrieveFile } = useIPFS();
  const { toast } = useToast();
  const [verifiedDrug, setVerifiedDrug] = useState<DrugDetails | null>(null);
  const [supplyChainEvents, setSupplyChainEvents] = useState<SupplyChainEvent[]>([]);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<VerificationData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      batchId: "",
    },
  });

  // Get batch ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlBatchId = urlParams.get('batchId');

  // Auto-fill form if batch ID is in URL
  React.useEffect(() => {
    if (urlBatchId && !form.getValues('batchId')) {
      form.setValue('batchId', urlBatchId);
    }
  }, [urlBatchId, form]);

  const verifyDrugMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const response = await apiRequest("GET", `/api/drug-batches/verify/${encodeURIComponent(batchId)}`);
      return response.json();
    },
    onSuccess: async (data) => {
      setVerifiedDrug(data.drug);
      setSupplyChainEvents(data.events || []);

      // Retrieve certificate from IPFS if available
      if (data.drug.ipfsHash) {
        try {
          const url = await retrieveFile(data.drug.ipfsHash);
          setCertificateUrl(url);
        } catch (error) {
          console.error("Failed to retrieve certificate:", error);
        }
      }

      toast({
        title: "Drug Verified",
        description: "Drug batch has been successfully verified",
      });
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Drug batch not found or invalid",
        variant: "destructive",
      });
      setVerifiedDrug(null);
      setSupplyChainEvents([]);
      setCertificateUrl(null);
    },
  });

  const onSubmit = async (data: VerificationData) => {
    setIsVerifying(true);
    try {
      await verifyDrugMutation.mutateAsync(data.batchId);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGenerateQR = async () => {
    if (verifiedDrug) {
      try {
        const qrData = createDrugQRData(verifiedDrug.batchId, verifiedDrug.tokenId);
        await downloadQRCode(qrData, `DrugAuth-${verifiedDrug.batchId}`);
        toast({
          title: "QR Code Generated",
          description: `QR code for batch ${verifiedDrug.batchId} has been downloaded`,
        });
      } catch (error) {
        toast({
          title: "QR Generation Failed",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
      }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral mb-2">Verify Drug Batch</h2>
        <p className="text-gray-600">
          Enter a batch ID or scan a QR code to verify drug authenticity and view supply chain history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Verification Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-search text-secondary"></i>
                <span>Drug Verification</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="batchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch ID or QR Code Data</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input
                              placeholder="Enter batch ID (e.g., BTC-2024-001)"
                              {...field}
                              className="flex-1"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="px-3"
                            title="Scan QR Code"
                            disabled={true} // QR scanning would need camera API
                          >
                            <i className="fas fa-qrcode"></i>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isVerifying || verifyDrugMutation.isPending}
                    className="w-full bg-secondary text-white hover:bg-secondary/90"
                  >
                    {isVerifying || verifyDrugMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-shield-check mr-2"></i>
                        Verify Drug
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Verification Result */}
          {verifiedDrug && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <i className="fas fa-check-circle text-green-600"></i>
                    <span>Drug Verified ✓</span>
                  </span>
                  <Badge variant={getStatusBadgeVariant(verifiedDrug.status)}>
                    {formatStatus(verifiedDrug.status)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Batch ID</label>
                      <p className="font-mono text-neutral bg-gray-50 px-3 py-2 rounded-md">
                        {verifiedDrug.batchId}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Drug Name</label>
                      <p className="text-neutral font-medium">{verifiedDrug.drugName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Manufacturer</label>
                      <p className="text-neutral">{verifiedDrug.manufacturer}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Manufacturing Date</label>
                      <p className="text-neutral">
                        {new Date(verifiedDrug.manufacturingDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Expiry Date</label>
                      <p className="text-neutral">
                        {new Date(verifiedDrug.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Current Owner</label>
                      <p className="text-neutral">{verifiedDrug.currentOwner}</p>
                    </div>
                  </div>
                </div>

                {certificateUrl && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
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

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleGenerateQR}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <i className="fas fa-qrcode"></i>
                    <span>Generate QR Code</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supply Chain History */}
          {supplyChainEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Supply Chain History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supplyChainEvents.map((event, index) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                          <i className={`${getEventIcon(event.eventType)} text-primary text-xs`}></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-neutral capitalize">
                              {event.eventType.replace("_", " ")}
                            </p>
                            <span className="text-sm text-gray-600">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {event.fromOwner ? `${event.fromOwner} → ` : ""}{event.toOwner}
                          </p>
                          {event.transactionHash && (
                            <p className="text-sm text-gray-500 mt-1 font-mono">
                              Tx: {event.transactionHash.slice(0, 10)}...{event.transactionHash.slice(-8)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verification Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center mt-0.5">
                  <i className="fas fa-info text-secondary text-xs"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">Enter Batch ID</p>
                  <p className="text-xs text-gray-600">
                    Type the exact batch ID from the drug package
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center mt-0.5">
                  <i className="fas fa-qrcode text-secondary text-xs"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">QR Code Scanning</p>
                  <p className="text-xs text-gray-600">
                    Scan the QR code on the drug package for quick verification
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center mt-0.5">
                  <i className="fas fa-shield-check text-secondary text-xs"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">Blockchain Verification</p>
                  <p className="text-xs text-gray-600">
                    All data is verified against the immutable blockchain record
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What You'll See</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-green-600 text-sm"></i>
                </div>
                <p className="text-sm text-gray-600">Complete drug information</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                  <i className="fas fa-route text-green-600 text-sm"></i>
                </div>
                <p className="text-sm text-gray-600">Full supply chain history</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                  <i className="fas fa-certificate text-green-600 text-sm"></i>
                </div>
                <p className="text-sm text-gray-600">Manufacturing certificates</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                  <i className="fas fa-clock text-green-600 text-sm"></i>
                </div>
                <p className="text-sm text-gray-600">Real-time ownership status</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
