import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBlockchain } from "@/hooks/use-blockchain";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const trackingSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
});

const transferSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  newOwner: z.string().min(1, "New owner is required"),
  newOwnerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  eventType: z.string().min(1, "Event type is required"),
});

type TrackingData = z.infer<typeof trackingSchema>;
type TransferData = z.infer<typeof transferSchema>;

interface DrugBatch {
  id: string;
  batchId: string;
  drugName: string;
  manufacturer: string;
  currentOwner: string;
  currentOwnerAddress: string;
  status: string;
  expiryDate: string;
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

export default function TrackSupplyChain() {
  const { account, contract, isConnected } = useBlockchain();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDrug, setSelectedDrug] = useState<DrugBatch | null>(null);
  const [supplyChainEvents, setSupplyChainEvents] = useState<SupplyChainEvent[]>([]);
  const [showTransferForm, setShowTransferForm] = useState(false);

  const trackingForm = useForm<TrackingData>({
    resolver: zodResolver(trackingSchema),
    defaultValues: { batchId: "" },
  });

  const transferForm = useForm<TransferData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      batchId: "",
      newOwner: "",
      newOwnerAddress: "",
      eventType: "transfer",
    },
  });

  // Fetch drug batches owned by current user
  const { data: ownedDrugs, isLoading: drugsLoading } = useQuery<DrugBatch[]>({
    queryKey: ["/api/drug-batches/owned", account],
    enabled: isConnected && !!account,
  });

  const trackDrugMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const response = await apiRequest("GET", `/api/drug-batches/track/${encodeURIComponent(batchId)}`);
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedDrug(data.drug);
      setSupplyChainEvents(data.events || []);
      transferForm.setValue("batchId", data.drug.batchId);
      toast({
        title: "Drug Tracked",
        description: "Supply chain history loaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Tracking Failed",
        description: error instanceof Error ? error.message : "Failed to track drug batch",
        variant: "destructive",
      });
    },
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: async (data: TransferData) => {
      const response = await apiRequest("POST", "/api/drug-batches/transfer", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drug-batches"] });
      setShowTransferForm(false);
      transferForm.reset();
      // Refresh tracking data
      if (selectedDrug) {
        trackDrugMutation.mutate(selectedDrug.batchId);
      }
      toast({
        title: "Ownership Transferred",
        description: "Drug ownership has been successfully transferred",
      });
    },
    onError: (error) => {
      toast({
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : "Failed to transfer ownership",
        variant: "destructive",
      });
    },
  });

  const onTrackSubmit = (data: TrackingData) => {
    trackDrugMutation.mutate(data.batchId);
  };

  const onTransferSubmit = async (data: TransferData) => {
    if (!contract || !selectedDrug) return;

    try {
      // Call smart contract to transfer ownership - tokenId is optional, use 0 as default
      const tx = await contract.transferOwnership(
        selectedDrug.tokenId || 0,
        data.newOwnerAddress,
        data.eventType
      );
      
      const receipt = await tx.wait();
      
      // Update backend with transaction details
      await transferOwnershipMutation.mutateAsync({
        batchId: selectedDrug.batchId,
        newOwner: data.newOwner,
        newOwnerAddress: data.newOwnerAddress,
        eventType: data.eventType,
        transactionHash: receipt.transactionHash,
      });
    } catch (error) {
      toast({
        title: "Blockchain Transfer Failed",
        description: error instanceof Error ? error.message : "Failed to execute blockchain transaction",
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

  const canTransfer = selectedDrug && account && selectedDrug.currentOwnerAddress.toLowerCase() === account.toLowerCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral mb-2">Track Supply Chain</h2>
        <p className="text-gray-600">
          Monitor drug batches through their complete supply chain journey
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-search text-primary"></i>
                <span>Track Drug Batch</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...trackingForm}>
                <form onSubmit={trackingForm.handleSubmit(onTrackSubmit)} className="space-y-4">
                  <FormField
                    control={trackingForm.control}
                    name="batchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter batch ID (e.g., BTC-2024-001)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={trackDrugMutation.isPending}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    {trackDrugMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Tracking...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-route mr-2"></i>
                        Track Supply Chain
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Drug Details */}
          {selectedDrug && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Drug Batch Information</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusBadgeVariant(selectedDrug.status)}>
                      {formatStatus(selectedDrug.status)}
                    </Badge>
                    {canTransfer && (
                      <Button
                        size="sm"
                        onClick={() => setShowTransferForm(!showTransferForm)}
                        className="bg-accent text-white hover:bg-accent/90"
                      >
                        <i className="fas fa-exchange-alt mr-1"></i>
                        Transfer
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Batch ID</label>
                      <p className="font-mono text-neutral bg-gray-50 px-3 py-2 rounded-md">
                        {selectedDrug.batchId}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Drug Name</label>
                      <p className="text-neutral font-medium">{selectedDrug.drugName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Manufacturer</label>
                      <p className="text-neutral">{selectedDrug.manufacturer}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Current Owner</label>
                      <p className="text-neutral">{selectedDrug.currentOwner}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Owner Address</label>
                      <p className="font-mono text-xs text-gray-500 break-all">
                        {selectedDrug.currentOwnerAddress}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Expiry Date</label>
                      <p className="text-neutral">
                        {new Date(selectedDrug.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transfer Ownership Form */}
          {showTransferForm && selectedDrug && canTransfer && (
            <Card className="border-accent">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-accent">
                  <i className="fas fa-exchange-alt"></i>
                  <span>Transfer Ownership</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...transferForm}>
                  <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4">
                    <FormField
                      control={transferForm.control}
                      name="newOwner"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Owner Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Central Distributor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transferForm.control}
                      name="newOwnerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Owner Ethereum Address</FormLabel>
                          <FormControl>
                            <Input placeholder="0x..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transferForm.control}
                      name="eventType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transfer Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select transfer type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="transfer">Transfer</SelectItem>
                              <SelectItem value="distribute">Distribute</SelectItem>
                              <SelectItem value="deliver">Deliver</SelectItem>
                              <SelectItem value="sell">Sell</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        disabled={transferOwnershipMutation.isPending}
                        className="bg-accent text-white hover:bg-accent/90"
                      >
                        {transferOwnershipMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Transferring...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check mr-2"></i>
                            Confirm Transfer
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowTransferForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Supply Chain Timeline */}
          {supplyChainEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Supply Chain Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-6">
                    {supplyChainEvents.map((event, index) => (
                      <div key={event.id} className="relative flex items-start space-x-4">
                        <div className={`w-8 h-8 ${getEventColor(event.eventType)} rounded-full flex items-center justify-center relative z-10`}>
                          <i className={`${getEventIcon(event.eventType)} text-white text-xs`}></i>
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-neutral capitalize">
                              {event.eventType.replace("_", " ")}
                            </p>
                            <span className="text-sm text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {event.fromOwner ? (
                              <p>
                                <span className="font-medium">{event.fromOwner}</span> → <span className="font-medium">{event.toOwner}</span>
                              </p>
                            ) : (
                              <p>
                                <span className="font-medium">{event.toOwner}</span>
                              </p>
                            )}
                          </div>
                          {event.transactionHash && (
                            <div className="mt-2">
                              <a
                                href={`https://goerli.etherscan.io/tx/${event.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-xs text-primary hover:text-primary/80"
                              >
                                <i className="fas fa-external-link-alt"></i>
                                <span>View Transaction</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* My Drug Batches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Drug Batches</CardTitle>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <p className="text-sm text-gray-600">Connect wallet to view your drug batches</p>
              ) : drugsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : ownedDrugs && ownedDrugs.length > 0 ? (
                <div className="space-y-3">
                  {ownedDrugs.map((drug) => (
                    <div
                      key={drug.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => trackingForm.setValue("batchId", drug.batchId)}
                    >
                      <p className="font-mono text-sm text-neutral">{drug.batchId}</p>
                      <p className="text-xs text-gray-600 mt-1">{drug.drugName}</p>
                      <Badge variant={getStatusBadgeVariant(drug.status)} className="mt-2">
                        {formatStatus(drug.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No drug batches found</p>
              )}
            </CardContent>
          </Card>

          {/* Supply Chain Stages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supply Chain Stages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-industry text-white text-xs"></i>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Manufacturing</p>
                    <p className="text-xs text-gray-600">Drug batch created</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-truck text-white text-xs"></i>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Transfer</p>
                    <p className="text-xs text-gray-600">Ownership changes</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-warehouse text-white text-xs"></i>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Distribution</p>
                    <p className="text-xs text-gray-600">Sent to distributors</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-store text-white text-xs"></i>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Delivery</p>
                    <p className="text-xs text-gray-600">Final destination</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
