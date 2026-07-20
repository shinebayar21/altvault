import type { Metadata } from "next";
import {
  Inter,
  Unbounded,
  Playfair_Display,
  Caveat,
  Lobster,
  Russo_One,
  Comfortaa,
  Amatic_SC,
  Marck_Script,
  Neucha,
  Oswald,
  Press_Start_2P,
} from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import Toast from "@/components/Toast";
import Link from "next/link";
import { getSettings } from "@/lib/db";
import { mnYear } from "@/lib/format";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-unbounded" });
// реклам баннерын текстэд сонгож болох нэмэлт фонтууд (бүгд кирилл дэмжинэ;
// фонтын файл нь зөвхөн ашиглагдсан үед л татагддаг тул олон байх нь хоргүй)
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], variable: "--font-playfair" });
const caveat = Caveat({ subsets: ["latin", "cyrillic"], variable: "--font-caveat" });
const lobster = Lobster({ weight: "400", subsets: ["latin", "cyrillic"], variable: "--font-lobster-v" });
const russo = Russo_One({ weight: "400", subsets: ["latin", "cyrillic"], variable: "--font-russo-v" });
const comfortaa = Comfortaa({ subsets: ["latin", "cyrillic"], variable: "--font-comfortaa-v" });
const amatic = Amatic_SC({ weight: ["400", "700"], subsets: ["latin", "cyrillic"], variable: "--font-amatic-v" });
const marck = Marck_Script({ weight: "400", subsets: ["latin", "cyrillic"], variable: "--font-marck-v" });
const neucha = Neucha({ weight: "400", subsets: ["latin", "cyrillic"], variable: "--font-neucha-v" });
const oswald = Oswald({ subsets: ["latin", "cyrillic"], variable: "--font-oswald-v" });
const pressStart = Press_Start_2P({ weight: "400", subsets: ["latin", "cyrillic"], variable: "--font-press-v" });

// Бүх хуудсыг хүсэлтийн үед render хийнэ — static prerender нь build үеийн
// хоосон seed DB-ээс (KICKS.MN г.м.) хуучин тохиргоог HTML-д шингээдэг байсан
export const dynamic = "force-dynamic";

// Гарчиг/тайлбарыг админы Тохиргоон дахь дэлгүүрийн нэрээс авна — нэр солиход дагаж өөрчлөгдөнө
export async function generateMetadata(): Promise<Metadata> {
  const s = getSettings();
  const name = s.store_name || "Altvault";
  const title = `${name} — Пүүзний нууц агуулах`;
  const description = "Хамгийн шинэ загварууд, хурдан хүргэлт";
  return {
    metadataBase: new URL("https://altvault.uk"),
    title,
    description,
    openGraph: {
      title,
      description,
      url: "https://altvault.uk",
      siteName: name,
      locale: "mn_MN",
      type: "website",
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  const storeName = settings.store_name || "Altvault";
  return (
    <html
      lang="mn"
      className={`${inter.variable} ${unbounded.variable} ${playfair.variable} ${caveat.variable} ${lobster.variable} ${russo.variable} ${comfortaa.variable} ${amatic.variable} ${marck.variable} ${neucha.variable} ${oswald.variable} ${pressStart.variable}`}
    >
      <body className="antialiased">
        <CartProvider>
          <Header storeName={storeName} logo={settings.store_logo || ""} />
          <Toast />
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
                    Пүүзний нууц агуулах.
                  </p>
                </div>
                <div className="text-sm text-zinc-400">
                  <div className="mb-2 font-semibold uppercase tracking-wider text-zinc-500">
                    Холбоо барих
                  </div>
                  <div>Утас: {settings.phone}</div>
                  <Link
                    href="/faq"
                    className="mt-2 inline-block text-zinc-400 transition hover:text-lime-400"
                  >
                    ❓ Түгээмэл асуулт
                  </Link>
                </div>
              </div>
              <div className="mt-8 border-t border-zinc-900 pt-5 text-xs text-zinc-600">
                © {mnYear()} {storeName} — Бүх эрх хуулиар хамгаалагдсан
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
