import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ConteX — AI Photo Studio",
  description:
    "Upload a photo and let ConteX AI enhance, reframe, and composite it automatically.",
  icons: {
    icon: "/subLogo.png",
    apple: "/subLogo.png",
  },
  openGraph: {
    title: "ConteX — AI Photo Studio",
    description:
      "Upload a photo and let ConteX AI enhance, reframe, and composite it automatically.",
    images: [{ url: "/subLogo.png", alt: "ConteX" }],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
