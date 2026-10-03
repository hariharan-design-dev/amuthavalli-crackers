import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  variable: "--font-noto-sans-tamil",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Amuthavalli Crackers",
  description: "Amuthavalli Crackers web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${notoSansTamil.variable}`}>
      <body className={plusJakartaSans.className}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
