import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ThermoWatch — Industrial Thermal Intelligence",
  description:
    "AI-powered detection and classification of industrial fires and persistent thermal sources using NASA FIRMS, OpenStreetMap and satellite data. SIH Problem Statement 26162.",
  keywords: [
    "NASA FIRMS",
    "thermal anomaly",
    "industrial fire detection",
    "satellite monitoring",
    "geospatial intelligence",
    "SIH 2024",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="font-sans bg-tw-navy text-tw-text antialiased">
        {children}
      </body>
    </html>
  );
}
