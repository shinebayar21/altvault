"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

/**
 * Сагсыг захиалга үүсгэхэд биш, ТӨЛӨГДСӨН үед л цэвэрлэнэ.
 * Захиалга үүсгэхэд checkout нь last_order_code-ыг localStorage-д тэмдэглэдэг;
 * тухайн захиалгын хуудас төлөгдсөн төлөвтэй нээгдэхэд сагсыг хоослоно.
 */
export default function CartClearOnPaid({ code, paid }: { code: string; paid: boolean }) {
  const { clear } = useCart();
  useEffect(() => {
    if (!paid) return;
    try {
      if (localStorage.getItem("last_order_code") === code) {
        clear();
        localStorage.removeItem("last_order_code");
      }
    } catch {}
    // clear нь render бүрт шинэ функц үүсдэг ч үйлдэл нь idempotent тул аюулгүй
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid, code]);
  return null;
}
