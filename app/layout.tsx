import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({ 
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter-tight"
});

export const metadata: Metadata = {
  title: "MOH Affiliate Fellowship Program",
  description: "Apply for the Affiliate Fellowship Program",
  icons: {
    icon: "/Rwanda-coat-of-arms.png",
    apple: "/Rwanda-coat-of-arms.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Rwanda-coat-of-arms.png" sizes="any" />
        <link rel="apple-touch-icon" href="/Rwanda-coat-of-arms.png" />
      </head>
      <body className={interTight.className}>
        <div className="min-h-screen bg-gray-50">{children}</div>
      </body>
    </html>
  );
}
