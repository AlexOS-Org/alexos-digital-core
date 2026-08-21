import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "When is my order dispatched?",
    a: "Orders are dispatched within 24 hours of confirmation on business days. Delivery timing can vary by destination, courier capacity and the selected product or variant.",
  },
  {
    q: "Which payment methods are available?",
    a: "Checkout currently offers Pay on delivery, M-Pesa instructions after ordering and bank transfer. Placing an order does not by itself prove that a payment has settled.",
  },
  {
    q: "Can I return an item?",
    a: "Items can be returned within 7 days of delivery when unused and in their original packaging and condition. Contact support before sending an item back; returned items are reviewed before a refund or exchange is approved.",
  },
  {
    q: "How do I track my order?",
    a: "Use the Track order page with your order number and the phone or email used at checkout.",
  },
  {
    q: "What if a product has sizes or colours?",
    a: "Open the product details page, choose an available size or colour, and check its current availability before adding it to your bag.",
  },
  {
    q: "How can I contact DailyGear?",
    a: "Use the Contact page for the support phone, email or WhatsApp details configured for the storefront.",
  },
];

export const Route = createFileRoute("/shop/faq")({
  head: () => ({
    meta: [
      { title: "Help & FAQ | DailyGear" },
      {
        name: "description",
        content:
          "Answers to common questions about DailyGear delivery, payment, returns and tracking.",
      },
      { property: "og:title", content: "Help & FAQ | DailyGear" },
      {
        property: "og:description",
        content: "Delivery, payment, returns and tracking questions answered.",
      },
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
      <Link to="/shop" className="text-xs font-semibold text-primary hover:underline">
        Back to DailyGear
      </Link>
      <h1 className="mt-4 text-3xl font-black tracking-tight">Help & FAQ</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Quick answers for browsing, ordering, delivery and after-sales support.
      </p>
      <Accordion type="single" collapsible className="mt-6 rounded-2xl border px-4">
        {FAQS.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger className="text-sm">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="mt-6 text-sm text-muted-foreground">
        Still need help?{" "}
        <Link to="/shop/contact" className="font-semibold text-primary hover:underline">
          Contact support
        </Link>{" "}
        or{" "}
        <Link to="/shop/track" className="font-semibold text-primary hover:underline">
          track an order
        </Link>
        .
      </p>
    </div>
  ),
});
