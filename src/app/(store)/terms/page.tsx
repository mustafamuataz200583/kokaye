import type { Metadata } from "next";
import { LegalPage } from "@/components/store/LegalPage";
import { getStoreSettings } from "@/lib/catalog";
import { DEFAULT_TERMS } from "@/lib/legal";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "الشروط" };
export const revalidate = 300;

export default async function TermsPage() {
  const s = await getStoreSettings();
  return <LegalPage title="الشروط" body={s.terms_text.trim() || DEFAULT_TERMS} updatedAt={s.terms_text.trim() ? formatDate(s.updated_at) : undefined} />;
}
