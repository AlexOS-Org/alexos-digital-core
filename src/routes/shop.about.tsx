import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/shop/about")({
  head: () => ({
    meta: [
      { title: "About us | DailyGear" },
      { name: "description", content: "Who we are and how we choose the gear we sell." },
      { property: "og:title", content: "About us | DailyGear" },
      { property: "og:description", content: "Who we are and how we choose the gear we sell." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">About us</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          We are a small team obsessed with everyday essentials that hold up. Every product in the
          catalogue is chosen for durability, honest pricing and real usefulness.
        </p>
        <p>
          Orders are packed and dispatched within 24 hours, and our support team answers every
          message personally. If something is not right, we make it right.
        </p>
      </div>
    </div>
  ),
});
