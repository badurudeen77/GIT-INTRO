import { useState } from "react";
import { uploadToIPFS, retrieveFromIPFS } from "@/utils/ipfs";
import { useToast } from "@/hooks/use-toast";

interface UseIPFSReturn {
  uploadFile: (file: File) => Promise<string | null>;
  retrieveFile: (hash: string) => Promise<string | null>;
  isUploading: boolean;
  isRetrieving: boolean;
}

export function useIPFS(): UseIPFSReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const hash = await uploadToIPFS(file);
      toast({
        title: "File Uploaded",
        description: `File uploaded to IPFS: ${hash}`,
      });
      return hash;
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file to IPFS",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const retrieveFile = async (hash: string): Promise<string | null> => {
    setIsRetrieving(true);
    try {
      const url = await retrieveFromIPFS(hash);
      return url;
    } catch (error) {
      toast({
        title: "Retrieval Failed",
        description: error instanceof Error ? error.message : "Failed to retrieve file from IPFS",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsRetrieving(false);
    }
  };

  return {
    uploadFile,
    retrieveFile,
    isUploading,
    isRetrieving,
  };
}
