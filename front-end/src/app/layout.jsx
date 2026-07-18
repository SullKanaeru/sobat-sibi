// ── app/layout.jsx ───────────────────────────────────────────────────────────
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GesturaHeader } from "@/components/auth/GestureHeader";
import ChatWidget from "@/components/chatbot/ChatWidget";
import "./globals.css";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Sign Language AI",
  description: "Deteksi Bahasa Isyarat Real-time",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body
        suppressHydrationWarning={true}
        className={`bg-gray-50 text-gray-900 font-sans ${poppins.variable}`} // Tema terang minimalis
      >
        {/* Layout Utama: Sidebar di Kiri, Konten di Kanan */}
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Area Sebelah Kanan (Header + Main Content) */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header Floating */}
            <Header />
            {/* Area Konten Dinamis */}
            <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6">
              <div className="flex-1 max-w-7xl w-full mx-auto rounded-lg flex flex-col justify-between">
                <div className="flex-grow">
                  {children}
                </div>
                <Footer />
              </div>
            </main>
          </div>
        </div>
        <ChatWidget />
      </body>
    </html>
  );
}
