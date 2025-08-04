import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const gilroy = localFont({
  src: "../assets/fonts/Gilroy-Regular.ttf",
  variable: "--font-gilroy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TSA BCP Map",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${gilroy.variable} antialiased h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
