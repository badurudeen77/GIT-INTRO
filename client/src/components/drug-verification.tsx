import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const verificationSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
});

type VerificationData = z.infer<typeof verificationSchema>;

interface VerificationResult {
  isValid: boolean;
  drug?: {
    batchId: string;
    drugName: string;
    manufacturer: string;
    status: string;
    expiryDate: string;
  };
  message: string;
}

export function DrugVerification() {
  const { toast } = useToast();
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const form = useForm<VerificationData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      batchId: "",
    },
  });

  const verifyDrugMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const response = await apiRequest("GET", `/api/drug-batches/verify/${encodeURIComponent(batchId)}`);
      return response.json();
    },
    onSuccess: (data) => {
      setVerificationResult({
        isValid: true,
        drug: data.drug,
        message: "Drug verified successfully",
      });
      toast({
        title: "Drug Verified ✓",
        description: "This drug is authentic and traceable in our system.",
      });
    },
    onError: (error) => {
      setVerificationResult({
        isValid: false,
        message: error instanceof Error ? error.message : "Drug verification failed",
      });
      toast({
        title: "Verification Failed",
        description: "Drug batch not found or invalid",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: VerificationData) => {
    setVerificationResult(null);
    verifyDrugMutation.mutate(data.batchId);
  };

  const handleScanQR = () => {
    toast({
      title: "QR Scanner",
      description: "QR code scanning would require camera permissions in a production app",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <i className="fas fa-search text-secondary"></i>
          <span>Verify Drug</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="batchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch ID or QR Code</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input
                        placeholder="Enter batch ID"
                        {...field}
                        className="flex-1"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleScanQR}
                      className="px-3"
                      title="Scan QR Code"
                    >
                      <i className="fas fa-qrcode"></i>
                    </Button>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={verifyDrugMutation.isPending}
              className="w-full bg-secondary text-white hover:bg-secondary/90"
            >
              {verifyDrugMutation.isPending ? (
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

        {/* Verification Result */}
        {verificationResult && (
          <Alert className={verificationResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-start space-x-3">
              <i className={`${verificationResult.isValid ? "fas fa-check-circle text-green-600" : "fas fa-exclamation-triangle text-red-600"} mt-0.5`}></i>
              <div className="flex-1">
                <AlertDescription>
                  <p className={`font-medium ${verificationResult.isValid ? "text-green-800" : "text-red-800"}`}>
                    {verificationResult.isValid ? "Drug Verified ✓" : "Verification Failed ✗"}
                  </p>
                  {verificationResult.isValid && verificationResult.drug && (
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-green-700">
                        <strong>Drug:</strong> {verificationResult.drug.drugName}
                      </p>
                      <p className="text-green-700">
                        <strong>Manufacturer:</strong> {verificationResult.drug.manufacturer}
                      </p>
                      <p className="text-green-700">
                        <strong>Status:</strong> {verificationResult.drug.status.replace("_", " ").toUpperCase()}
                      </p>
                    </div>
                  )}
                  <p className={`text-sm mt-1 ${verificationResult.isValid ? "text-green-700" : "text-red-700"}`}>
                    {verificationResult.message}
                  </p>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
