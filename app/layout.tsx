import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Sinhala, Noto_Sans_Tamil, Italiana, Cormorant_Garamond, Outfit } from "next/font/google";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { HeaderGate } from "@/components/layout/HeaderGate";
import { getServerUser } from "@/lib/server-user";
import "./globals.css";
import "@/components/layout/app-header.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSinhala = Noto_Sans_Sinhala({ variable: "--font-noto-sinhala", subsets: ["sinhala"], display: "swap" });
const notoTamil = Noto_Sans_Tamil({ variable: "--font-noto-tamil", subsets: ["tamil"], display: "swap" });
const italiana = Italiana({ variable: "--font-italiana", weight: "400", subsets: ["latin"], display: "swap" });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", weight: ["500", "600"], style: ["normal", "italic"], subsets: ["latin"], display: "swap" });
const outfit = Outfit({ variable: "--font-outfit", weight: ["300", "400", "600"], subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Invitation Studio", template: "%s | Invitation Studio" },
  description: "Create, share, and manage beautiful invitations for the moments worth celebrating.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const initialUser = await getServerUser();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSinhala.variable} ${notoTamil.variable} ${italiana.variable} ${cormorant.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><AuthProvider initialUser={initialUser}><HeaderGate />{children}</AuthProvider></body>
    </html>
  );
}
