import QRCode from "qrcode";

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};

export const generateQRCodeSVG = async (data: string): Promise<string> => {
  try {
    const qrCodeSVG = await QRCode.toString(data, {
      type: "svg",
      width: 256,
      margin: 2,
    });
    return qrCodeSVG;
  } catch (error) {
    console.error("Error generating QR code SVG:", error);
    throw new Error("Failed to generate QR code SVG");
  }
};

export const downloadQRCode = async (data: string, filename: string): Promise<void> => {
  try {
    const qrCodeDataURL = await generateQRCode(data);
    const link = document.createElement("a");
    link.href = qrCodeDataURL;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading QR code:", error);
    throw new Error("Failed to download QR code");
  }
};

export const createDrugQRData = (batchId: string, tokenId?: string): string => {
  const baseUrl = window.location.origin;
  const verifyUrl = `${baseUrl}/verify?batchId=${encodeURIComponent(batchId)}`;
  
  if (tokenId) {
    return `${verifyUrl}&tokenId=${tokenId}`;
  }
  
  return verifyUrl;
};
