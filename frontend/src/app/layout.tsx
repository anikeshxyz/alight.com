import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Instrument_Serif } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-serif",
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: {
    default: "Alight International | Multi-Vendor Marketplace",
    template: "%s | Alight International",
  },
  description:
    "India's premier B2B and multi-vendor marketplace for stainless-steel modular kitchen accessories, hardware, bathroom fixtures, and wardrobe storage solutions.",
  keywords: [
    "Alight International",
    "modular kitchen accessories",
    "kitchen organizers",
    "wardrobe pullouts",
    "cabinet hardware",
    "B2B marketplace",
    "multi-vendor retail",
  ],
  authors: [{ name: "Alight International Team" }],
  creator: "Alight International",
  publisher: "Alight International",
  metadataBase: new URL("https://alight.com"),
  openGraph: {
    title: "Alight International | Multi-Vendor Marketplace",
    description:
      "Engineered hardware, modular kitchen pullouts, and architectural organizers from verified manufacturers.",
    url: "https://alight.com",
    siteName: "Alight International",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alight International | Multi-Vendor Marketplace",
    description:
      "Engineered hardware, modular kitchen pullouts, and architectural organizers from verified manufacturers.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-screen flex flex-col antialiased font-sans bg-brand-slate-50 text-brand-slate-900 selection:bg-purple-600 selection:text-white">
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
              </WishlistProvider>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
