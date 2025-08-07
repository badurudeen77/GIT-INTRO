import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DrugRegistrationForm } from "@/components/drug-registration-form";
import { useBlockchain } from "@/hooks/use-blockchain";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RegisterDrug() {
  const { isConnected, account, userRole } = useBlockchain();

  if (!isConnected || !account) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-wallet text-primary text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600 mb-4">
              Please connect your MetaMask wallet to register drug batches
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral mb-2">Register New Drug Batch</h2>
        <p className="text-gray-600">
          Create a new pharmaceutical drug batch record on the blockchain
        </p>
      </div>

      {userRole && userRole !== "manufacturer" && (
        <Alert className="mb-6">
          <i className="fas fa-info-circle"></i>
          <AlertDescription>
            You are currently registered as a "{userRole}". Typically, only manufacturers 
            register new drug batches. Please ensure you have the proper authorization.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DrugRegistrationForm />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Registration Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <i className="fas fa-check text-primary text-xs"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">Unique Batch ID</p>
                  <p className="text-xs text-gray-600">
                    Use a unique identifier like "BTC-2024-001"
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <i className="fas fa-check text-primary text-xs"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">Valid Expiry Date</p>
                  <p className="text-xs text-gray-600">
                    Must be in the future for successful registration
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <i className="fas fa-check text-primary text-xs"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">Certificate Upload</p>
                  <p className="text-xs text-gray-600">
                    Optional but recommended for verification
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <i className="fas fa-check text-primary text-xs"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">Gas Fees</p>
                  <p className="text-xs text-gray-600">
                    Ensure you have enough Goerli ETH for transaction
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">1</span>
                </div>
                <p className="text-sm text-gray-600">
                  Certificate uploaded to IPFS for secure storage
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">2</span>
                </div>
                <p className="text-sm text-gray-600">
                  Drug metadata recorded on Ethereum blockchain
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">3</span>
                </div>
                <p className="text-sm text-gray-600">
                  NFT token created representing the drug batch
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">4</span>
                </div>
                <p className="text-sm text-gray-600">
                  QR code generated for easy verification
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
