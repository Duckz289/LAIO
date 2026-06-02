import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "LAIO - Luyện Từ All-In-One",
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
        {/* Khung layout chung sẽ nằm ở đây (Navbar/Sidebar) */}
        <main>{children}</main>
      </body>
    </html>
  );
}