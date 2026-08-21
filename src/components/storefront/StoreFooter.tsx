import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone, ShieldCheck, Truck, Undo2 } from "lucide-react";
import type { Storefront } from "@/lib/storefront/api";
import { DAILYGEAR_LOGO, DAILYGEAR_NAME } from "@/lib/storefront/brand";

const TRUST = [
  { icon: Truck, title: "Fast delivery", copy: "Dispatched within 24 hours" },
  { icon: ShieldCheck, title: "Secure checkout", copy: "Your details stay private" },
  { icon: Undo2, title: "Easy returns", copy: "7-day return window" },
];

export function StoreFooter({ store }: { store: Storefront | null }) {
  return (
    <footer className="dailygear-store-footer mt-14 border-t">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3 rounded-2xl border bg-card p-4">
              <t.icon className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.copy}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <img
                  src={store?.logo_url ?? DAILYGEAR_LOGO}
                  alt=""
                  aria-hidden="true"
                  width={92}
                  height={48}
                  className="h-full w-full object-contain"
                />
              </span>
              <p className="text-base font-black tracking-tight">{store?.name ?? DAILYGEAR_NAME}</p>
            </div>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              {store?.tagline ?? "Smart, convenient gear for the way your day moves."}
            </p>
          </div>

          <nav className="space-y-2 text-sm">
            <p className="font-semibold">Shop</p>
            <Link to="/shop/products" className="block text-muted-foreground hover:text-foreground">
              All products
            </Link>
            <Link to="/shop/track" className="block text-muted-foreground hover:text-foreground">
              Track my order
            </Link>
            <Link to="/shop/cart" className="block text-muted-foreground hover:text-foreground">
              My bag
            </Link>
          </nav>

          <nav className="space-y-2 text-sm">
            <p className="font-semibold">Support</p>
            <Link to="/shop/faq" className="block text-muted-foreground hover:text-foreground">
              FAQ
            </Link>
            <Link to="/shop/contact" className="block text-muted-foreground hover:text-foreground">
              Contact us
            </Link>
            <Link
              to="/shop/policies/$slug"
              params={{ slug: "returns" }}
              className="block text-muted-foreground hover:text-foreground"
            >
              Returns & refunds
            </Link>
            <Link
              to="/shop/policies/$slug"
              params={{ slug: "shipping" }}
              className="block text-muted-foreground hover:text-foreground"
            >
              Shipping policy
            </Link>
            <Link
              to="/shop/policies/$slug"
              params={{ slug: "payments" }}
              className="block text-muted-foreground hover:text-foreground"
            >
              Payment methods
            </Link>
          </nav>

          <div className="space-y-2 text-sm">
            <p className="font-semibold">Get in touch</p>
            {store?.support_phone ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {store.support_phone}
              </p>
            ) : null}
            {store?.support_email ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {store.support_email}
              </p>
            ) : null}
            {store?.whatsapp ? (
              <p className="flex items-start gap-2 text-muted-foreground">
                <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> WhatsApp {store.whatsapp}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {store?.name ?? DAILYGEAR_NAME}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              to="/shop/policies/$slug"
              params={{ slug: "privacy" }}
              className="hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              to="/shop/policies/$slug"
              params={{ slug: "terms" }}
              className="hover:text-foreground"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
