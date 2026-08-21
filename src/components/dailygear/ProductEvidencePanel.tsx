import { useMemo, useState } from "react";
import { ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDeleteProductEvidence,
  useProductEvidence,
  useProducts,
  useSaveProductEvidence,
} from "@/lib/dailygear/api";
import type { ProductEvidence, ProductEvidenceInsert } from "@/lib/dailygear/types";

const SOURCE_TYPES: Array<{
  value: ProductEvidence["source_type"];
  label: string;
}> = [
  { value: "commerce_manager", label: "Commerce Manager" },
  { value: "meta_ad", label: "Meta ad" },
  { value: "instagram_post", label: "Instagram post" },
  { value: "facebook_post", label: "Facebook post" },
  { value: "pixel_event", label: "Pixel event" },
  { value: "existing_app", label: "Existing app" },
  { value: "image_asset", label: "Image asset" },
  { value: "competitor_research", label: "Competitor research" },
  { value: "auren_recommendation", label: "Auren recommendation" },
];

const EMPTY = {
  product_id: "",
  source_type: "instagram_post" as ProductEvidence["source_type"],
  source_id: "",
  source_url: "",
  source_label: "",
  source_date: "",
  title: "",
  raw_excerpt: "",
  observed_price: "",
  confidence: "medium" as ProductEvidence["confidence"],
  reconciliation_status: "candidate" as ProductEvidence["reconciliation_status"],
};

function statusLabel(status: ProductEvidence["reconciliation_status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function ProductEvidencePanel() {
  const { data: evidence = [], isLoading } = useProductEvidence();
  const { data: products = [] } = useProducts();
  const save = useSaveProductEvidence();
  const remove = useDeleteProductEvidence();
  const [form, setForm] = useState(EMPTY);

  const productNames = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  );

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    if (!form.title.trim() || !form.source_label.trim()) return;
    const values: ProductEvidenceInsert = {
      product_id: form.product_id || null,
      source_type: form.source_type,
      source_id: form.source_id.trim() || null,
      source_url: form.source_url.trim() || null,
      source_label: form.source_label.trim(),
      source_date: form.source_date ? new Date(form.source_date).toISOString() : null,
      title: form.title.trim(),
      raw_excerpt: form.raw_excerpt.trim() || null,
      observed_price: form.observed_price ? Number(form.observed_price) : null,
      confidence: form.confidence,
      reconciliation_status: form.reconciliation_status,
      historical: true,
      metadata: {},
      observed_attributes: {},
    };
    await save.mutateAsync(values);
    setForm(EMPTY);
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-3xl border-primary/15 bg-card/80 shadow-[0_18px_60px_-42px_hsl(var(--primary)/0.55)]">
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/[0.08] via-transparent to-emerald-500/[0.08]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4 text-primary" />
                Evidence ledger
              </CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Link source URLs, captions, ad IDs and observed claims before a product is
                considered ready for publication. Historical evidence does not prove current stock.
              </p>
            </div>
            <Badge variant="outline" className="rounded-full">
              {evidence.length} record{evidence.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Evidence title</Label>
              <Input
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
                placeholder="LADIES LOAFER SUED campaign evidence"
              />
            </div>
            <div className="space-y-2">
              <Label>Source type</Label>
              <Select
                value={form.source_type}
                onValueChange={(value) =>
                  set("source_type", value as ProductEvidence["source_type"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source label</Label>
              <Input
                value={form.source_label}
                onChange={(event) => set("source_label", event.target.value)}
                placeholder="Daily Gear 2025 · Instagram"
              />
            </div>
            <div className="space-y-2">
              <Label>Link to product</Label>
              <Select
                value={form.product_id || "none"}
                onValueChange={(value) => set("product_id", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unmatched candidate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unmatched candidate</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observed price (KES)</Label>
              <Input
                type="number"
                min="0"
                value={form.observed_price}
                onChange={(event) => set("observed_price", event.target.value)}
                placeholder="Leave blank if unavailable"
              />
            </div>
            <div className="space-y-2">
              <Label>Source URL</Label>
              <Input
                type="url"
                value={form.source_url}
                onChange={(event) => set("source_url", event.target.value)}
                placeholder="https://www.instagram.com/p/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Source ID</Label>
              <Input
                value={form.source_id}
                onChange={(event) => set("source_id", event.target.value)}
                placeholder="Campaign, ad, post or catalogue ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Observed date</Label>
              <Input
                type="date"
                value={form.source_date}
                onChange={(event) => set("source_date", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confidence</Label>
              <Select
                value={form.confidence}
                onValueChange={(value) => set("confidence", value as ProductEvidence["confidence"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reconciliation status</Label>
              <Select
                value={form.reconciliation_status}
                onValueChange={(value) =>
                  set("reconciliation_status", value as ProductEvidence["reconciliation_status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candidate">Candidate</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Observed copy or factual excerpt</Label>
              <Textarea
                rows={3}
                value={form.raw_excerpt}
                onChange={(event) => set("raw_excerpt", event.target.value)}
                placeholder="Paste only the factual source excerpt you want to preserve."
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={submit}
              disabled={!form.title.trim() || !form.source_label.trim() || save.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {save.isPending ? "Saving…" : "Add evidence"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="rounded-3xl border-dashed p-6 text-sm text-muted-foreground">
          Loading evidence records…
        </Card>
      ) : evidence.length === 0 ? (
        <Card className="rounded-3xl border-dashed p-6 text-sm text-muted-foreground">
          No evidence records are stored yet. Connect a candidate to a real product only after its
          source, current availability and catalogue identity are verified.
        </Card>
      ) : (
        <div className="grid gap-3">
          {evidence.map((record) => (
            <Card key={record.id} className="rounded-2xl border-border/70 bg-card/75">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{record.title}</p>
                    <Badge variant="outline" className="rounded-full text-[10px]">
                      {statusLabel(record.reconciliation_status)}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full text-[10px]">
                      {record.confidence} confidence
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {record.source_label}
                    {record.product_id
                      ? ` · ${productNames.get(record.product_id) ?? "Linked product"}`
                      : " · Unmatched candidate"}
                    {record.source_date
                      ? ` · ${new Date(record.source_date).toLocaleDateString()}`
                      : ""}
                  </p>
                  {record.raw_excerpt ? (
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      “{record.raw_excerpt}”
                    </p>
                  ) : null}
                  {record.source_url ? (
                    <a
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      href={record.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open source <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove.mutate(record.id)}
                  aria-label={`Remove ${record.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
