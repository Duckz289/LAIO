import type { Metadata } from "next";
import "./globals.css"; // <-- BẮT BUỘC: Phải có dòng import này!

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
      <body>{children}</body>
    </html>
  );
}