import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evently — Events, beautifully managed",
  description: "Premium event registration and secure QR check-in."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain">{children}</body>
    </html>
  );
}