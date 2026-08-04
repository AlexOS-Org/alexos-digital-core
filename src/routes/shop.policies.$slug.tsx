import { createFileRoute } from "@tanstack/react-router";

const POLICIES: Record<string, { title: string; body: string[] }> = {
  returns: {
    title: "Returns & refunds",
    body: [
      "Items can be returned within 7 days of delivery, provided they are unused and in original packaging.",
      "Refunds are processed within 5 business days of the returned item being received and inspected.",
    ],
  },
  shipping: {
    title: "Shipping policy",
    body: [
      "Orders are dispatched within 24 hours of confirmation on business days.",
      "Delivery fees are calculated at checkout and may be waived above the free-delivery threshold.",
    ],
  },
  privacy: {
    title: "Privacy policy",
    body: [
      "We collect only the details required to fulfil and deliver your order.",
      "Your information is never sold, and is shared only with the courier handling your delivery.",
    ],
  },
  terms: {
    title: "Terms of service",
    body: [
      "By placing an order you confirm the details provided are accurate and complete.",
      "Prices, availability and delivery estimates may change without notice before an order is confirmed.",
    ],
  },
};

export const Route = createFileRoute("/shop/policies/$slug")({
  head: ({ params }) => {
    const policy = POLICIES[params.slug];
    const title = `${policy?.title ?? "Policy"} | DailyGear`;
    return {
      meta: [
        { title },
        { name: "description", content: policy?.body[0] ?? "Store policy information." },
        { property: "og:title", content: title },
        { property: "og:description", content: policy?.body[0] ?? "Store policy information." },
        { property: "og:type", content: "website" },
      ],
      links: [
        {
          rel: "canonical",
          href: `https://alexos-digital-core.lovable.app/shop/policies/${params.slug}`,
        },
      ],
    };
  },
  component: PolicyPage,
});

function PolicyPage() {
  const { slug } = Route.useParams();
  const policy = POLICIES[slug];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">{policy?.title ?? "Policy"}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {(policy?.body ?? ["This policy is not available."]).map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </div>
  );
}
