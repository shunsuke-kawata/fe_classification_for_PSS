// layout.tsx
import type { Metadata } from "next";
import config from "@/config/config.json";
import "@/styles/AllComponentsStyle.css";
import StoreProvider from "@/app/StoreProvider";

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
      <body style={{ margin: 0 }}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
