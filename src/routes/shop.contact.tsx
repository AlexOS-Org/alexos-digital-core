import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";
import { DAILYGEAR_SOCIAL_LINKS, whatsappHref } from "@/lib/storefront/social-links";
import { useStorefront } from "@/lib/storefront/api";

export const Route = createFileRoute("/shop/contact")({
  head: () => ({
    meta: [
      { title: "Contact us | DailyGear" },
      { name: "description", content: "Reach our support team by phone, email or WhatsApp." },
      { property: "og:title", content: "Contact us | DailyGear" },
      {
        property: "og:description",
        content: "Reach our support team by phone, email or WhatsApp.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: store } = useStorefront();
  const rows = [
    {
      icon: Phone,
      label: "Phone",
      value: store?.support_phone,
      href: store?.support_phone ? `tel:${store.support_phone}` : null,
    },
    {
      icon: Mail,
      label: "Email",
      value: store?.support_email,
      href: store?.support_email ? `mailto:${store.support_email}` : null,
    },
    {
      icon: null,
      label: "WhatsApp",
      value: store?.whatsapp ?? "0722658824",
      href: whatsappHref(store?.whatsapp),
    },
  ].filter((r) => r.value);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">Contact us</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Use the support details below for order questions, delivery help or product clarification.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {rows.length ? (
          rows.map((r) => (
            <a
              key={r.label}
              href={r.href ?? undefined}
              className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
            >
              {r.icon ? (
                <r.icon className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <img
                  src={DAILYGEAR_SOCIAL_LINKS.whatsapp.iconSrc}
                  alt=""
                  aria-hidden="true"
                  width={20}
                  height={20}
                  className="h-5 w-5 shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className="truncate text-sm font-semibold">{r.value}</p>
              </div>
            </a>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Contact details will appear here once they are added in storefront settings.
          </p>
        )}
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {Object.values(DAILYGEAR_SOCIAL_LINKS).map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
          >
            <img
              src={social.iconSrc}
              alt=""
              aria-hidden="true"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain"
            />
            <span className="text-sm font-semibold group-hover:text-primary">
              Follow on {social.label}
            </span>
          </a>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border bg-muted/40 p-4">
        <p className="text-sm font-semibold">Looking for a quick answer?</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Check the FAQ, track an existing order, or review delivery and returns information before
          contacting support.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-primary">
          <Link to="/shop/faq" className="hover:underline">
            Read the FAQ
          </Link>
          <Link to="/shop/track" className="hover:underline">
            Track an order
          </Link>
          <Link to="/shop/policies/$slug" params={{ slug: "shipping" }} className="hover:underline">
            Shipping policy
          </Link>
          <Link to="/shop/policies/$slug" params={{ slug: "returns" }} className="hover:underline">
            Returns policy
          </Link>
        </div>
      </div>
    </div>
  );
}
