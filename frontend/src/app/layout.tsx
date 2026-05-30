import type { Metadata } from "next";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';

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
        <NextTopLoader 
          color="#E53935" 
          initialPosition={0.08} 
          crawlSpeed={200} 
          height={3} 
          crawl={true} 
          showSpinner={false} 
          easing="ease" 
          speed={200} 
          shadow="0 0 10px #E53935,0 0 5px #E53935" 
        />
        {children}
      </body>
    </html>
  );
}
