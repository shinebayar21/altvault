export function tugrug(n: number): string {
  return n.toLocaleString("mn-MN") + "₮";
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "Төлбөр хүлээгдэж буй",
  paid: "Төлөгдсөн",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
};

export const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  delivered: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-700",
};
