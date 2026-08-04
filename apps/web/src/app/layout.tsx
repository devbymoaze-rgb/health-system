import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Eye",
  description: "Next.js project with Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-emerald-50 text-emerald-950 flex overflow-hidden h-screen w-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
