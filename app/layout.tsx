import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wave Log",
  description: "Ton journal de sessions de surf."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
