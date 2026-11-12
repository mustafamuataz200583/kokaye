import type { Metadata } from "next";
import { LegalPage } from "@/components/store/LegalPage";
import { getStoreSettings } from "@/lib/catalog";
import { DEFAULT_PRIVACY } from "@/lib/legal";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "سياسة الخصوصية" };
export const revalidate = 300;

export default async function PrivacyPage() {
  const s = await getStoreSettings();
  return <LegalPage title="سياسة الخصوصية" body={s.privacy_text.trim() || DEFAULT_PRIVACY} updatedAt={s.privacy_text.trim() ? formatDate(s.updated_at) : undefined} />;
}
