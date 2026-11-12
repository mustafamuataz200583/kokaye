import Link from "next/link";
export default function AdminNotFound() {
  return <div className="py-20 text-center"><p className="text-xl">غير موجود</p><Link href="/admin" className="btn btn-ghost btn-sm mt-6">رجوع</Link></div>;
}
