import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShoppingCart, Database, CheckCircle2 } from "lucide-react";
import { SectionTitle, Card, KpiCard, Tag } from "@/components/dashboard/primitives";
import { browseMarketplace, purchaseProduct, myPurchases } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/lender/marketplace")({
  component: LenderMarketplace,
});

function LenderMarketplace() {
  const qc = useQueryClient();
  const browse = useServerFn(browseMarketplace);
  const purchase = useServerFn(purchaseProduct);
  const purchasesFn = useServerFn(myPurchases);

  const products = useQuery({ queryKey: ["mkt", "browse"], queryFn: () => browse() });
  const purchases = useQuery({ queryKey: ["mkt", "purchases"], queryFn: () => purchasesFn() });

  const buy = useMutation({
    mutationFn: (product_id: string) => purchase({ data: { product_id, access_days: 30 } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mkt"] }),
  });

  const spent = (purchases.data ?? []).reduce((a, p) => a + Number(p.amount_kes), 0);

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Marketplace" title="Verified farmer data" sub="Time-boxed, consented payloads. 30-day default window." />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Catalogue size" value={String((products.data ?? []).length)} tone="sky" icon={Database} />
        <KpiCard label="Purchases" value={String((purchases.data ?? []).length)} tone="emerald" icon={CheckCircle2} />
        <KpiCard label="Total spent" value={`KES ${spent.toLocaleString()}`} tone="gold" icon={ShoppingCart} />
      </div>

      <Card title="Available data products">
        {products.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
          (products.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No products listed yet.</p> :
          <ul className="divide-y divide-border/60">
            {(products.data ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.product_type} · Farmer {String(p.farmer_id).slice(0, 8)}</p>
                </div>
                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground">KES {Number(p.price_kes).toLocaleString()}</span>
                  <button
                    disabled={buy.isPending}
                    onClick={() => buy.mutate(p.id)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    Purchase
                  </button>
                </span>
              </li>
            ))}
          </ul>
        }
      </Card>

      <Card title="My purchases">
        {(purchases.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No purchases yet.</p> :
          <ul className="divide-y divide-border/60">
            {(purchases.data ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <span>{(p.data_products as { title?: string } | null)?.title ?? "Product"}</span>
                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground">KES {Number(p.amount_kes).toLocaleString()}</span>
                  <Tag label={p.status} tone={p.status === "active" ? "emerald" : "gold"} />
                  {p.expires_at && <span className="text-xs text-muted-foreground">exp {new Date(p.expires_at).toLocaleDateString()}</span>}
                </span>
              </li>
            ))}
          </ul>
        }
      </Card>
    </div>
  );
}
