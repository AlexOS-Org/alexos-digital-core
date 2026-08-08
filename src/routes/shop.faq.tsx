import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Orders are dispatched within 24 hours and typically arrive in 1–3 business days.",
  },
  { q: "How do I pay?", a: "You can pay on delivery, by M-Pesa or by bank transfer at checkout." },
  {
    q: "Can I return an item?",
    a: "Yes — returns are accepted within 7 days of delivery in original condition.",
  },
  {
    q: "How do I track my order?",
    a: "Use the Track order page with your order number and the phone or email you checked out with.",
  },
];

export const Route = createFileRoute("/shop/faq")({
  head: () => ({
    meta: [
      { title: "Help & FAQ | DailyGear" },
      {
        name: "description",
        content: "Answers to common questions about delivery, payment and returns.",
      },
      { property: "og:title", content: "Help & FAQ | DailyGear" },
      { property: "og:description", content: "Delivery, payment and returns questions answered." },
      { property: "og:type", content: "website" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">Help & FAQ</h1>
      <Accordion type="single" collapsible className="mt-6 rounded-2xl border px-4">
        {FAQS.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger className="text-sm">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  ),
});
