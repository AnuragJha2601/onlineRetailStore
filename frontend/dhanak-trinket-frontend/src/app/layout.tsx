import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleOAuthWrapper } from "@/contexts/GoogleOAuthWrapper";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dhanak Trinket — Ethnic Finds, Timeless Shine",
    template: "%s | Dhanak Trinket",
  },
  description:
    "Shop trendy, premium necklaces, earrings, rings, anti-tarnish jewellery and timeless ethnic finds at Dhanak Trinket. Ethnic finds, timeless shine.",
  keywords: [
    "ethnic jewellery",
    "anti-tarnish jewellery",
    "necklaces",
    "earrings",
    "rings",
    "bangles",
    "imitation jewellery",
    "Dhanak Trinket",
    "Dhanak",
    "mangalsutra"
  ],
  metadataBase: new URL("https://dhanaktrinket.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Dhanak Trinket — Ethnic Finds, Timeless Shine",
    description:
      "Shop trendy, premium necklaces, earrings, rings, anti-tarnish jewellery and timeless ethnic finds at Dhanak Trinket.",
    url: "https://dhanaktrinket.com",
    siteName: "Dhanak Trinket",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/logo.jpg",
        width: 512,
        height: 512,
        alt: "Dhanak Trinket Logo",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <GoogleOAuthWrapper>
          <AuthProvider>{children}</AuthProvider>
        </GoogleOAuthWrapper>
      </body>
    </html>
  );
}
