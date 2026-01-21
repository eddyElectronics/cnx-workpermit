import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบคำขอเข้าปฏิบัติงาน - ท่าอากาศยานเชียงใหม่",
  description: "Work Permit System - Chiang Mai International Airport",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
