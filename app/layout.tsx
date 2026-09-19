import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AntdRegistry } from '@ant-design/nextjs-registry';
import "./globals.css";

// Configure the Inter font
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MR POLAA — Unisex Salon",
  description: "MR POLAA is a unisex salon in Walasmulla, Sri Lanka. Book haircuts, styling, shaves and salon treatments online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Apply the font class to the body */}
      <body className={inter.className} suppressHydrationWarning>
        <AntdRegistry>
          {children}
        </AntdRegistry>
      </body>
    </html>
  );
}