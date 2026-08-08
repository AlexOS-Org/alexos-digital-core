import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
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
    { icon: Phone, label: "Phone", value: store?.support_phone },
    { icon: Mail, label: "Email", value: store?.support_email },
    { icon: MessageCircle, label: "WhatsApp", value: store?.whatsapp },
  ].filter((r) => r.value);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">Contact us</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We reply to every message, usually within a few hours.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {rows.length ? (
          rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 rounded-2xl border bg-card p-4">
              <r.icon className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className="truncate text-sm font-semibold">{r.value}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Contact details will appear here once they are added in storefront settings.
          </p>
        )}
      </div>
    </div>
  );
}
