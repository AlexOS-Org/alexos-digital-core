import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { IntelligencePanel } from "@/components/dailygear/IntelligencePanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";

export const Route = createFileRoute("/_authenticated/e-commerce/landing-pages")({
  head: () => ({
    meta: [
      { title: "Landing Pages | DailyGear" },
      { name: "description", content: "Generated product pages, copy blocks and SEO metadata." },
      { property: "og:title", content: "Landing Pages | DailyGear" },
      {
        property: "og:description",
        content: "Generated product pages, copy blocks and SEO metadata.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LandingPagesPage,
});

function LandingPagesPage() {
  const navigate = useNavigate();
  const { products, context, isLoading } = useCommerceData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Landing Pages"
        description="Generated product pages, copy blocks and SEO metadata. Preview product landing pages and launch store campaigns."
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/e-commerce/store" })}>
            Store preview
          </Button>
        }
      />

      <IntelligencePanel kind="landing" ctx={context} ready={!isLoading} />

      <Card className="rounded-3xl border-border">
        <CardHeader>
          <CardTitle>Product campaigns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading landing page previews…</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No products available yet. Add products to generate landing page ideas.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {products.map((product) => (
                <div key={product.id} className="rounded-3xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sku ?? "SKU missing"}
                      </p>
                    </div>
                    <Badge variant={product.status === "active" ? "secondary" : "outline"}>
                      {product.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                    {product.description ??
                      "No page copy yet. Use the product description to populate the landing page hero section."}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate({ to: "/e-commerce/store" })}
                    >
                      Preview in store
                    </Button>
                    <Button size="sm" onClick={() => navigate({ to: "/e-commerce/checkout" })}>
                      Sell now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
