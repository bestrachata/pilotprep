import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pilot Prep",
  description: "Cognitive training for pilot aptitude tests",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pilot Prep",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full overflow-hidden font-[var(--font-geist)]">
        {children}
      </body>
    </html>
  );
}
