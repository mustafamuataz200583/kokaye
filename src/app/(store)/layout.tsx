import { StoreProviders } from "@/components/store/StoreProviders";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { Toaster } from "@/components/store/Toaster";
import { FloatingCart } from "@/components/store/FloatingCart";
import { StoreStatusBanner } from "@/components/store/StoreStatusBanner";
import { getPublicSettings } from "@/lib/catalog";

export const revalidate = 60;

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  return (
    <StoreProviders>
        <Header topSlot={<StoreStatusBanner settings={settings} />} />
        <main id="main" className="min-h-[70vh]">
          {children}
        </main>
        <Footer settings={settings} />
        <CartDrawer deliveryNote={settings.delivery_note} />
        <FloatingCart />
        <Toaster />
    </StoreProviders>
  );
}
