import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useBlockchain } from "@/hooks/use-blockchain";
import { useIPFS } from "@/hooks/use-ipfs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const drugRegistrationSchema = z.object({
  drugName: z.string().min(1, "Drug name is required"),
  batchId: z.string().min(1, "Batch ID is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  manufacturingDate: z.string().min(1, "Manufacturing date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  certificate: z.instanceof(FileList).optional(),
});

type DrugRegistrationData = z.infer<typeof drugRegistrationSchema>;

export function DrugRegistrationForm() {
  const { contract, account, isConnected } = useBlockchain();
  const { uploadFile, isUploading } = useIPFS();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegistering, setIsRegistering] = useState(false);

  const form = useForm<DrugRegistrationData>({
    resolver: zodResolver(drugRegistrationSchema),
    defaultValues: {
      drugName: "",
      batchId: "",
      manufacturer: "",
      manufacturingDate: "",
      expiryDate: "",
    },
  });

  const registerDrugMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/drug-batches", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drug-batches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Drug Registered",
        description: "Drug batch has been successfully registered on the blockchain",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register drug",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: DrugRegistrationData) => {
    if (!isConnected || !contract || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to register a drug",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);

    try {
      let ipfsHash = "";

      // Upload certificate to IPFS if provided
      if (data.certificate && data.certificate.length > 0) {
        const certificateFile = data.certificate[0];
        const hash = await uploadFile(certificateFile);
        if (hash) {
          ipfsHash = hash;
        }
      }

      // Convert dates to timestamps
      const manufacturingTimestamp = new Date(data.manufacturingDate).getTime() / 1000;
      const expiryTimestamp = new Date(data.expiryDate).getTime() / 1000;

      // Register on smart contract
      const tx = await contract.registerDrug(
        data.batchId,
        data.drugName,
        data.manufacturer,
        expiryTimestamp,
        ipfsHash
      );

      const receipt = await tx.wait();
      const tokenId = receipt.logs[0]?.args?.tokenId;

      // Save to database
      await registerDrugMutation.mutateAsync({
        batchId: data.batchId,
        drugName: data.drugName,
        manufacturer: data.manufacturer,
        manufacturingDate: data.manufacturingDate,
        expiryDate: data.expiryDate,
        currentOwner: data.manufacturer,
        currentOwnerAddress: account,
        status: "manufactured",
        ipfsHash,
        contractAddress: contract.target,
        tokenId: tokenId?.toString(),
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register drug on blockchain",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const isLoading = isRegistering || isUploading || registerDrugMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <i className="fas fa-plus-circle text-primary"></i>
          <span>Quick Register Drug</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="drugName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Drug Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Aspirin 100mg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., BTC-2024-004" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., PharmaCorp Ltd." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacturingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturing Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="certificate"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Certificate Upload</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => onChange(e.target.files)}
                        className="hidden"
                        id="certificate-upload"
                        {...rest}
                      />
                      <label
                        htmlFor="certificate-upload"
                        className="cursor-pointer block"
                      >
                        <i className="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i>
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">
                          PDF, PNG, JPG up to 10MB
                        </p>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={!isConnected || isLoading}
              className="w-full bg-primary text-white hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {isUploading ? "Uploading..." : "Registering..."}
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i>
                  Register Drug
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
