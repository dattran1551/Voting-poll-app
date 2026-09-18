import type { Metadata } from "next";
import { Inter, Barlow_Semi_Condensed } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Brand fonts, pulled from the real VNGGames ON Figma file (KprMCUGsAJYHAl5Dpd81ov):
// - Inter (weights 600/800/900) is used for nav labels, headlines, and CTA buttons.
// - Barlow Semi Condensed (weight 400) is used for body copy.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["600", "800", "900"],
});

const barlowSemiCondensed = Barlow_Semi_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Audience Q&A — VNGGames ON",
  description:
    "Đặt câu hỏi ẩn danh cho VNGGames ON / Ask anonymous questions for VNGGames ON",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlowSemiCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-bg font-body text-white">
        <Toaster richColors position="top-center" />
        {children}
      </body>
    </html>
  );
}
