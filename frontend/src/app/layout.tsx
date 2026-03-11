import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proton LMS - Learning Management System",
  description: "Comprehensive Learning Management System for Proton Coaching Institution. Student enrollment, demo class management, and complete academic operations.",
  keywords: "LMS, coaching, education, student management, Proton Coaching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
