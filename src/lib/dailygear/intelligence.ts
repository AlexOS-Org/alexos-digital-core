import { useQuery } from "@tanstack/react-query";
import { computeProductPerformance, effectivePrice, isDeadStock } from "./calculations";
import { productReadinessSignals } from "./product-readiness-signals";
import type {
  IntelligenceContext,
  IntelligenceInsight,
  IntelligenceKind,
  IntelligenceProvider,
} from "./types";

/**
 * Intelligence provider registry.
 *
 * Insights are never generated inside components. Providers are registered
 * here and merged at read time, so a future marketplace API, scraper or AI
 * model is added by appending one object — every intelligence page picks it
 * up with no UI change.
 */

const num = (v: unknown) => Number(v ?? 0) || 0;

/** Derives signals purely from the business's own data. Always available. */
const firstPartyProvider: IntelligenceProvider = {
  id: "first-party",
  label: "DailyGear internal data",
  kinds: ["market", "competitor", "marketing", "landing", "advertising"],
  enabled: true,
  description: "Signals derived from your own catalogue, orders and customers.",
  async load(kind, ctx) {
    if (kind === "market") return marketSignals(ctx);
    if (kind === "landing") return landingSignals(ctx);
    if (kind === "advertising") return adSignals(ctx);
    if (kind === "marketing") return marketingSignals(ctx);
    return competitorSignals(ctx);
  },
};

function marketSignals(ctx: IntelligenceContext): IntelligenceInsight[] {
  const perf = computeProductPerformance(ctx.products, ctx.orders, ctx.orderItems);
  const out: IntelligenceInsight[] = [...productReadinessSignals(ctx)];

  const top = perf.filter((p) => p.unitsSold > 0).slice(0, 3);
  for (const p of top) {
    out.push({
      id: `market-top-${p.product.id}`,
      kind: "market",
      title: `${p.product.name} is pulling demand`,
      summary: `${p.unitsSold} units sold generating ${ctx.currency} ${p.revenue.toLocaleString()}.`,
      metric: `${p.unitsSold} units`,
      tone: "positive",
      recommendation: "Secure re-stock early and feature it in the next campaign.",
      source: "Internal sales data",
    });
  }

  const dead = perf.filter(isDeadStock).slice(0, 3);
  for (const p of dead) {
    out.push({
      id: `market-dead-${p.product.id}`,
      kind: "market",
      title: `${p.product.name} shows no demand`,
      summary: `Holding ${p.product.stock_quantity} units with no recent sales.`,
      tone: "warning",
      recommendation: "Bundle, discount or delist to release working capital.",
      source: "Internal sales data",
    });
  }

  const categories = new Set(ctx.products.map((p) => p.category_id).filter(Boolean));
  if (ctx.products.length && categories.size <= 1) {
    out.push({
      id: "market-category-spread",
      kind: "market",
      title: "Catalogue concentrated in one category",
      summary: "Demand risk is high when the assortment lacks breadth.",
      tone: "neutral",
      recommendation: "Test adjacent categories such as travel bags or accessories.",
      source: "Catalogue analysis",
    });
  }

  return out;
}

function competitorSignals(ctx: IntelligenceContext): IntelligenceInsight[] {
  const priced = ctx.products.filter((p) => effectivePrice(p) > 0);
  if (!priced.length) return [];
  const avg = priced.reduce((s, p) => s + effectivePrice(p), 0) / priced.length;

  const thinMargin = priced.filter(
    (p) => num(p.cost_price) > 0 && effectivePrice(p) / num(p.cost_price) < 1.25,
  );

  const out: IntelligenceInsight[] = [
    {
      id: "competitor-price-position",
      kind: "competitor",
      title: "Baseline price position captured",
      summary: `Average selling price is ${ctx.currency} ${avg.toLocaleString(undefined, { maximumFractionDigits: 0 })} across ${priced.length} products.`,
      tone: "neutral",
      recommendation: "Connect a competitor source to benchmark this against the market.",
      source: "Catalogue pricing",
    },
  ];

  if (thinMargin.length) {
    out.push({
      id: "competitor-thin-margin",
      kind: "competitor",
      title: `${thinMargin.length} product(s) priced below a defensible margin`,
      summary: "Margins under 25% leave no room to respond to a competitor discount.",
      tone: "warning",
      recommendation: "Re-price or renegotiate supply cost before running promotions.",
      source: "Margin analysis",
    });
  }

  return out;
}

function marketingSignals(ctx: IntelligenceContext): IntelligenceInsight[] {
  const byChannel = new Map<string, number>();
  for (const o of ctx.orders) {
    byChannel.set(o.channel, (byChannel.get(o.channel) ?? 0) + num(o.total));
  }
  const ranked = [...byChannel.entries()].sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return [];

  const [channel, revenue] = ranked[0];
  return [
    {
      id: "marketing-top-channel",
      kind: "marketing",
      title: `${channel} is your strongest channel`,
      summary: `${ctx.currency} ${revenue.toLocaleString()} in attributed order value.`,
      tone: "positive",
      recommendation: "Shift budget toward this channel and mirror its creative elsewhere.",
      source: "Order channel attribution",
    },
  ];
}

function landingSignals(ctx: IntelligenceContext): IntelligenceInsight[] {
  const missingCopy = ctx.products.filter((p) => !p.description || p.description.length < 60);
  if (!missingCopy.length) return [];
  return [
    {
      id: "landing-missing-copy",
      kind: "landing",
      title: `${missingCopy.length} product(s) lack sales copy`,
      summary: "Pages without descriptive copy convert and rank poorly.",
      tone: "warning",
      recommendation: "Generate hero, benefits and FAQ blocks for these products.",
      source: "Catalogue completeness",
    },
  ];
}

function adSignals(ctx: IntelligenceContext): IntelligenceInsight[] {
  const perf = computeProductPerformance(ctx.products, ctx.orders, ctx.orderItems);
  const hero = perf.find((p) => p.unitsSold > 0);
  if (!hero) return [];
  return [
    {
      id: "ads-hero-product",
      kind: "advertising",
      title: `Lead the next campaign with ${hero.product.name}`,
      summary: "Proven sell-through makes this the lowest-risk creative subject.",
      tone: "positive",
      recommendation: "Build three ad variants: price-led, benefit-led and social proof.",
      source: "Sales performance",
    },
  ];
}

/** Not-yet-connected sources. Surfaced in the UI as available integrations. */
const pendingProviders: IntelligenceProvider[] = [
  {
    id: "marketplace-trends",
    label: "Marketplace demand feed",
    kinds: ["market"],
    enabled: false,
    description: "Category and search demand for bags, watches and electronics.",
    load: async () => [],
  },
  {
    id: "competitor-monitor",
    label: "Competitor monitor",
    kinds: ["competitor"],
    enabled: false,
    description: "Price, promotion and assortment tracking for named competitors.",
    load: async () => [],
  },
  {
    id: "ads-platforms",
    label: "Ad platform connectors",
    kinds: ["marketing", "advertising"],
    enabled: false,
    description: "Meta, Google, TikTok and WhatsApp campaign performance.",
    load: async () => [],
  },
  {
    id: "ai-studio",
    label: "AI generation",
    kinds: ["landing", "advertising"],
    enabled: false,
    description: "Copywriting, creative and audience generation.",
    load: async () => [],
  },
];

export const intelligenceProviders: IntelligenceProvider[] = [
  firstPartyProvider,
  ...pendingProviders,
];

export function providersFor(kind: IntelligenceKind) {
  return intelligenceProviders.filter((p) => p.kinds.includes(kind));
}

export function useIntelligence(kind: IntelligenceKind, ctx: IntelligenceContext, ready = true) {
  return useQuery({
    queryKey: [
      "dailygear",
      "intelligence",
      kind,
      ctx.products.length,
      ctx.orders.length,
      ctx.orderItems.length,
      ctx.customers.length,
    ],
    enabled: ready,
    queryFn: async () => {
      const active = providersFor(kind).filter((p) => p.enabled);
      const results = await Promise.all(active.map((p) => p.load(kind, ctx)));
      return results.flat();
    },
  });
}
