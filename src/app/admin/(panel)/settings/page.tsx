import { SettingsForm } from "@/components/admin/SettingsForm";
import { getAdminSettings } from "@/lib/admin-data";

export const metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const s = await getAdminSettings();
  return (
    <div>
      <h1 className="text-3xl">إعدادات المتجر</h1>
      <p className="mt-1 mb-6 text-sm text-muted">{s.is_open ? "المتجر يستقبل طلبات هسه." : "المتجر ما يستقبل طلبات هسه."}</p>
      <SettingsForm s={JSON.parse(JSON.stringify(s))} />
    </div>
  );
}
