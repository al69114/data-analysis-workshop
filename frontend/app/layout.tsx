import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Analysis Workshop",
  description: "Drag-and-drop project builder for first data science projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
