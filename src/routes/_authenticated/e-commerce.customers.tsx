import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, ShoppingBag, Star, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { KpiCard } from "@/components/dailygear/KpiCard";
import { CustomerFormDialog } from "@/components/dailygear/CustomerFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";
import { useDeleteCustomer } from "@/lib/dailygear/api";
import { DG_CURRENCY } from "@/lib/dailygear/constants";
import type { Customer } from "@/lib/dailygear/types";

export const Route = createFileRoute("/_authenticated/e-commerce/customers")({
  head: () => ({
    meta: [
      { title: "Customers | DailyGear" },
      { name: "description", content: "Purchase history, lifetime value and segmentation." },
      { property: "og:title", content: "Customers | DailyGear" },
      { property: "og:description", content: "Purchase history, lifetime value and segmentation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomersPage,
});

const money = (v: number) =>
  `${DG_CURRENCY} ${Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function CustomersPage() {
  const { customers, orders, isLoading } = useCommerceData();
  const remove = useDeleteCustomer();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /** Per-customer aggregated stats derived entirely from cached order data. */
  const customerStats = useMemo(() => {
    const map = new Map<string, { orderCount: number; totalSpent: number }>();
    for (const o of orders) {
      if (!o.customer_id) continue;
      const prev = map.get(o.customer_id) ?? { orderCount: 0, totalSpent: 0 };
      map.set(o.customer_id, {
        orderCount: prev.orderCount + 1,
        totalSpent: prev.totalSpent + Number(o.total ?? 0),
      });
    }
    return map;
  }, [orders]);

  const summary = useMemo(() => {
    const totalSpend = [...customerStats.values()].reduce((s, v) => s + v.totalSpent, 0);
    const returning = [...customerStats.values()].filter((v) => v.orderCount > 1).length;
    const avg = customers.length > 0 && totalSpend > 0 ? totalSpend / customers.length : 0;
    return { total: customers.length, returning, avg };
  }, [customers, customerStats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.first_name, c.last_name, c.email, c.phone, c.city]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(q)),
    );
  }, [customers, query]);

  function openEdit(c: Customer) {
    setEditing(c);
    setDialogOpen(true);
  }

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Purchase history, lifetime value and segmentation."
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            New customer
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total customers" value={summary.total} icon={Users} loading={isLoading} />
        <KpiCard
          label="Returning customers"
          value={summary.returning}
          icon={Star}
          tone="positive"
          hint={
            summary.total > 0
              ? `${Math.round((summary.returning / summary.total) * 100)}% retention rate`
              : undefined
          }
          loading={isLoading}
        />
        <KpiCard
          label="Avg lifetime value"
          value={money(summary.avg)}
          icon={ShoppingBag}
          loading={isLoading}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, email or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Loading */}
      {isLoading && <Skeleton className="h-72 w-full rounded-2xl" />}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Users className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {customers.length
                ? "No customers match your search."
                : "Add your first customer to start tracking purchase history and lifetime value."}
            </p>
            {customers.length === 0 && (
              <Button size="sm" onClick={openNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add customer
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!isLoading && filtered.length > 0 && (
        <Card className="rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium text-right">Orders</th>
                  <th className="px-4 py-3 font-medium text-right">Total spent</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const s = customerStats.get(c.id) ?? { orderCount: 0, totalSpent: 0 };
                  const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ");
                  const location = [c.city, c.country].filter(Boolean).join(", ");
                  return (
                    <tr key={c.id} className="border-t border-border/70 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{fullName}</p>
                        {s.orderCount > 1 && (
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-success">
                            Returning
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs">{c.email ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{c.phone ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{location || "—"}</td>
                      <td className="px-4 py-3 text-right">{s.orderCount}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {s.totalSpent > 0 ? money(s.totalSpent) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Edit customer"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Delete customer"
                            onClick={() => remove.mutate(c.id)}
                            disabled={remove.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} customer={editing} />
    </div>
  );
}
