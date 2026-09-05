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
  title: "MR POLAA — Premium Grooming",
  description: "An exclusive sanctuary for the modern gentleman. Book precision haircuts, hot towel shaves, and premium artisan barber slots online.",
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