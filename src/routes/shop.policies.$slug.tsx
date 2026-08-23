import { createFileRoute, Link } from "@tanstack/react-router";

const POLICIES: Record<string, { title: string; intro: string; body: string[] }> = {
  returns: {
    title: "Returns & refunds",
    intro: "A clear guide to returning an eligible DailyGear order.",
    body: [
      "Items can be returned within 7 days of delivery when they are unused and in their original packaging and condition.",
      "Please contact DailyGear support before sending an item back. Keep your order number and proof of purchase available so we can locate the order and explain the next step.",
      "Returned items are reviewed when received. If the return is approved, the refund process begins within 5 business days of receipt and inspection. The final timing can depend on the original payment method.",
      "Items that are used, damaged after delivery, incomplete or missing their original packaging may not qualify for a refund or exchange. If an item arrives damaged or defective, contact support promptly with the order details and photos where possible.",
    ],
  },
  shipping: {
    title: "Shipping policy",
    intro: "Delivery information for DailyGear orders in Kenya.",
    body: [
      "Orders are dispatched within 24 hours of confirmation on business days. The delivery fee shown at checkout is the amount used for the order summary.",
      "Delivery timing can vary by destination, courier capacity and the availability of the selected product or variant. We will use the contact details provided at checkout if we need to clarify delivery information.",
      "A free-delivery threshold may apply when it is configured for the storefront. The checkout total is the final delivery amount shown before you place the order.",
      "If you need help with a delivery, use Track your order or contact DailyGear with your order number and the phone or email used at checkout.",
    ],
  },
  payments: {
    title: "Payment methods",
    intro: "Payment options currently shown in DailyGear checkout.",
    body: [
      "DailyGear checkout currently offers Pay on delivery, M-Pesa instructions after ordering and bank transfer. Choose the method you intend to use and provide accurate contact details.",
      "Placing an order creates an order record and does not, by itself, prove that a payment has settled. M-Pesa and bank-transfer instructions or confirmation are handled separately, while Pay on delivery remains a delivery-time payment method.",
      "The amount displayed in the order summary is recomputed from the current product or variant price and availability when the order is placed. If the catalogue has changed, checkout may stop and ask you to review your bag.",
    ],
  },
  privacy: {
    title: "Privacy policy",
    intro: "How DailyGear uses information needed to support the store.",
    body: [
      "We collect the contact and delivery details needed to process, support and deliver an order. We do not sell this information.",
      "Order details may be shared with the courier or service provider handling delivery, only as needed to complete the requested service. We retain order information for operational and support records.",
      "For a privacy question or request, contact DailyGear through the support details shown on the Contact page.",
    ],
  },
  terms: {
    title: "Terms of service",
    intro: "The basic terms for browsing and ordering from DailyGear.",
    body: [
      "By placing an order, you confirm that the delivery and contact details provided are accurate and complete.",
      "Prices, stock, availability and delivery charges are checked when an order is placed. A product may be unavailable or an order may require review if the current catalogue has changed.",
      "Product images are intended to represent the listed item, but colour and appearance can vary between screens and lighting conditions. Choose the listed size or colour option carefully where options are provided.",
      "These terms work together with the Returns & refunds, Shipping policy, Payment methods and Privacy policy pages. If you need clarification before ordering, contact support.",
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
        { name: "description", content: policy?.intro ?? "Store policy information." },
        { property: "og:title", content: title },
        { property: "og:description", content: policy?.intro ?? "Store policy information." },
        { property: "og:type", content: "website" },
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
      <Link to="/shop" className="text-xs font-semibold text-primary hover:underline">
        Back to DailyGear
      </Link>
      <h1 className="mt-4 text-3xl font-black tracking-tight">{policy?.title ?? "Policy"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {policy?.intro ?? "This policy is not available."}
      </p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {(policy?.body ?? ["This policy is not available."]).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t pt-5 text-xs font-semibold text-primary">
        <Link to="/shop/policies/$slug" params={{ slug: "returns" }} className="hover:underline">
          Returns & refunds
        </Link>
        <Link to="/shop/policies/$slug" params={{ slug: "shipping" }} className="hover:underline">
          Shipping
        </Link>
        <Link to="/shop/policies/$slug" params={{ slug: "payments" }} className="hover:underline">
          Payment methods
        </Link>
        <Link to="/shop/contact" className="hover:underline">
          Contact support
        </Link>
      </div>
    </div>
  );
}
