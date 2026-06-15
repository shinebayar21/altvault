import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import { getSettings } from "@/lib/db";

export const metadata: Metadata = {
  title: "Онлайн дэлгүүр",
  description: "Монгол онлайн дэлгүүр",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  return (
    <html lang="mn">
      <body>
        <CartProvider>
          <Header storeName={settings.store_name || "Онлайн дэлгүүр"} />
          <main className="max-w-6xl mx-auto px-4 py-6 min-h-[80vh]">{children}</main>
          <footer className="border-t border-slate-200 bg-white mt-10">
            <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-slate-500 flex justify-between">
              <span>© {new Date().getFullYear()} {settings.store_name}</span>
              <span>Утас: {settings.phone}</span>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
