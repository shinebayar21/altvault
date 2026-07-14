import type { Metadata } from "next";
import { Inter, Unbounded, Playfair_Display, Caveat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import { getSettings } from "@/lib/db";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-unbounded" });
// реклам баннерын текстэд сонгож болох нэмэлт фонтууд
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], variable: "--font-playfair" });
const caveat = Caveat({ subsets: ["latin", "cyrillic"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "KICKS.MN — Пүүзний онлайн дэлгүүр",
  description: "Шинэ үеийн пүүзний онлайн дэлгүүр — хамгийн шинэ загварууд, хурдан хүргэлт",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  const storeName = settings.store_name || "KICKS.MN";
  return (
    <html lang="mn" className={`${inter.variable} ${unbounded.variable} ${playfair.variable} ${caveat.variable}`}>
      <body className="antialiased">
        <CartProvider>
          <Header storeName={storeName} logo={settings.store_logo || ""} />
          <main className="mx-auto min-h-[80vh] max-w-6xl px-4 py-8">{children}</main>
          <footer className="mt-16 border-t border-zinc-800 bg-zinc-950">
            <div className="mx-auto max-w-6xl px-4 py-10">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="font-display text-lg font-bold uppercase tracking-wide">
                    {storeName.replace(/\.\w+$/, "")}
                    <span className="text-lime-400">.</span>
                  </div>
                  <p className="mt-2 max-w-xs text-sm text-zinc-500">
                    Шинэ үеийн пүүзний дэлгүүр. Гудамжны соёл, спортын хүч — нэг дор.
                  </p>
                </div>
                <div className="text-sm text-zinc-400">
                  <div className="mb-2 font-semibold uppercase tracking-wider text-zinc-500">
                    Холбоо барих
                  </div>
                  <div>Утас: {settings.phone}</div>
                </div>
              </div>
              <div className="mt-8 border-t border-zinc-900 pt-5 text-xs text-zinc-600">
                © {new Date().getFullYear()} {storeName} — Бүх эрх хуулиар хамгаалагдсан
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
