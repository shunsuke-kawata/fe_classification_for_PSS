import type { Metadata } from "next";
import config from "@/config/config.json"
import "@/app/globals.css";

export const metadata: Metadata = {
  title: config.title,
  description: config.title,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
