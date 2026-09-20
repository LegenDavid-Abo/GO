import QRCode from "qrcode";
export async function qrDataUrl(value: string) {
  return QRCode.toDataURL(value, { width: 800, margin: 2, errorCorrectionLevel: "H" });
}