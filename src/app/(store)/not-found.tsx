import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-k flex min-h-[60vh] flex-col items-center justify-center pt-28 text-center">
      <p className="latin text-6xl italic text-champagne">404</p>
      <h1 className="mt-4 text-3xl">هالصفحة مو موجودة</h1>
      <p className="mt-3 text-muted">يمكن الرابط تغير. ارجع للمنيو وكمل لحظتك.</p>
      <Link href="/menu" className="btn btn-primary mt-8">المنيو</Link>
    </div>
  );
}
