import { Check, Compass, Sparkles } from "lucide-react";

const VALUES = [
  {
    index: "01",
    icon: Sparkles,
    title: "Everyday, elevated",
    copy: "A focused storefront for useful pieces that fit how the day actually moves.",
  },
  {
    index: "02",
    icon: Compass,
    title: "Choose with confidence",
    copy: "Current sizes, colours and availability stay visible on the product detail page.",
  },
  {
    index: "03",
    icon: Check,
    title: "A clear next step",
    copy: "Review your order, find support and track progress without leaving the journey.",
  },
];

export function StoreVisualValueGrid() {
  return (
    <section className="mt-8 grid gap-3 md:grid-cols-3" aria-label="Why shop DailyGear">
      {VALUES.map((value) => (
        <article
          key={value.index}
          className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
          <div className="relative flex items-start justify-between gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <value.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-black tracking-[0.18em] text-muted-foreground">
              {value.index}
            </span>
          </div>
          <h2 className="relative mt-5 text-base font-bold tracking-tight">{value.title}</h2>
          <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
            {value.copy}
          </p>
        </article>
      ))}
    </section>
  );
}
