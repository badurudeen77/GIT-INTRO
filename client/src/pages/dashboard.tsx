import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { DrugDetailsModal } from "@/components/drug-details-modal";
import { DrugRegistrationForm } from "@/components/drug-registration-form";
import { DrugVerification } from "@/components/drug-verification";
import { SupplyChainTimeline } from "@/components/supply-chain-timeline";
import { useBlockchain } from "@/hooks/use-blockchain";
import { downloadQRCode, createDrugQRData } from "@/utils/qr-code";
import { useToast } from "@/hooks/use-toast";

interface DrugBatch {
  id: string;
  batchId: string;
  drugName: string;
  manufacturer: string;
  currentOwner: string;
  status: string;
  expiryDate: string;
  createdAt: string;
}

interface DashboardStats {
  totalBatches: number;
  activeTransfers: number;
  verifiedDrugs: number;
  gasUsed: string;
}

export default function Dashboard() {
  const { isConnected, account } = useBlockchain();
  const { toast } = useToast();
  const [selectedDrug, setSelectedDrug] = useState<DrugBatch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isConnected && !!account,
  });

  // Fetch recent drug batches
  const { data: recentBatches, isLoading: batchesLoading } = useQuery<DrugBatch[]>({
    queryKey: ["/api/drug-batches", currentPage],
    enabled: isConnected && !!account,
  });

  const handleGenerateQR = async (batch: DrugBatch) => {
    try {
      const qrData = createDrugQRData(batch.batchId);
      await downloadQRCode(qrData, `DrugAuth-${batch.batchId}`);
      toast({
        title: "QR Code Generated",
        description: `QR code for batch ${batch.batchId} has been downloaded`,
      });
    } catch (error) {
      toast({
        title: "QR Generation Failed",
        description: "Failed to generate QR code",
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
      case "pending":
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

  if (!isConnected || !account) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-wallet text-primary text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600 mb-4">
              Please connect your MetaMask wallet to access the DrugAuth dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral mb-2">
              Pharmaceutical Supply Chain Dashboard
            </h2>
            <p className="text-gray-600">
              Track and verify drug batches across the entire supply chain
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            <Link href="/register">
              <Button className="bg-primary text-white hover:bg-primary/90 flex items-center space-x-2">
                <i className="fas fa-plus"></i>
                <span>Register New Drug</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Batches</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-neutral">
                      {stats?.totalBatches || 0}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-box text-primary"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Transfers</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-neutral">
                      {stats?.activeTransfers || 0}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-truck text-accent"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Verified Drugs</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-neutral">
                      {stats?.verifiedDrugs || 0}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shield-check text-secondary"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Gas Used (ETH)</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-neutral">
                      {stats?.gasUsed || "0.0000"}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fab fa-ethereum text-purple-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Drug Batches */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Drug Batches</span>
                <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option>All Status</option>
                  <option>In Transit</option>
                  <option>Delivered</option>
                  <option>Expired</option>
                </select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentBatches && recentBatches.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-sm font-medium text-gray-600 pb-3">
                          Batch ID
                        </th>
                        <th className="text-left text-sm font-medium text-gray-600 pb-3">
                          Drug Name
                        </th>
                        <th className="text-left text-sm font-medium text-gray-600 pb-3">
                          Current Owner
                        </th>
                        <th className="text-left text-sm font-medium text-gray-600 pb-3">
                          Status
                        </th>
                        <th className="text-left text-sm font-medium text-gray-600 pb-3">
                          Expiry
                        </th>
                        <th className="text-right text-sm font-medium text-gray-600 pb-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentBatches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-gray-50">
                          <td className="py-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-mono text-sm text-neutral">
                                {batch.batchId}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div>
                              <p className="font-medium text-neutral">
                                {batch.drugName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {batch.manufacturer}
                              </p>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="text-sm text-gray-900">
                              {batch.currentOwner}
                            </span>
                          </td>
                          <td className="py-4">
                            <Badge variant={getStatusBadgeVariant(batch.status)}>
                              {formatStatus(batch.status)}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <span className="text-sm text-neutral">
                              {new Date(batch.expiryDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedDrug(batch)}
                                className="text-primary hover:text-primary/80"
                              >
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGenerateQR(batch)}
                                className="text-gray-600 hover:text-primary"
                              >
                                <i className="fas fa-qrcode"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">No drug batches found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <DrugRegistrationForm />
          <DrugVerification />
          <SupplyChainTimeline />
        </div>
      </div>

      {/* Drug Details Modal */}
      {selectedDrug && (
        <DrugDetailsModal
          drug={selectedDrug}
          isOpen={!!selectedDrug}
          onClose={() => setSelectedDrug(null)}
        />
      )}
    </div>
  );
}
