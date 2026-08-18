import type { Metadata } from "next";
import "./globals.css"; // <-- BẮT BUỘC: Phải có dòng import này!

import MotionProvider from "@/components/MotionProvider";

export const metadata: Metadata = {
  title: "Luyện Từ - LAIO",
  description: "Ứng dụng học từ vựng thông minh",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}