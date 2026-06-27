import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Wallet, TrendingUp, Power } from "lucide-react";
import { SectionTitle, Card, KpiCard, Tag } from "@/components/dashboard/primitives";
import { listMyProducts, upsertProduct, mySales, myWallet, PRODUCT_CATALOGUE } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/farmer/marketplace")({
  component: MarketplacePage,
});

function MarketplacePage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyProducts);
  const salesFn = useServerFn(mySales);
  const walletFn = useServerFn(myWallet);
  const upsertFn = useServerFn(upsertProduct);

  const products = useQuery({ queryKey: ["mkt", "products"], queryFn: () => listFn() });
  const sales = useQuery({ queryKey: ["mkt", "sales"], queryFn: () => salesFn() });
  const wallet = useQuery({ queryKey: ["mkt", "wallet"], queryFn: () => walletFn() });

  const upsert = useMutation({
    mutationFn: (input: { product_type: string; title: string; price_kes: number; is_active?: boolean }) =>
      upsertFn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mkt"] }),
  });

  const [type, setType] = useState(PRODUCT_CATALOGUE[0].type);

  const totalEarned = (sales.data ?? []).filter((s) => s.status === "active").reduce((a, s) => a + Number(s.amount_kes), 0);

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Data Marketplace" title="Sell your data — keep control" sub="Lenders pay you for time-boxed, consented access." />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Wallet balance" value={`KES ${Number(wallet.data?.balance_kes ?? 0).toLocaleString()}`} tone="emerald" icon={Wallet} />
        <KpiCard label="Lifetime earnings" value={`KES ${totalEarned.toLocaleString()}`} tone="sky" icon={TrendingUp} />
        <KpiCard label="Active listings" value={String((products.data ?? []).filter((p) => p.is_active).length)} tone="gold" icon={Power} />
      </div>

      <Card title="Add a data product" icon={Plus}>
        <div className="flex flex-wrap items-end gap-3">
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="rounded-md border border-border/60 bg-surface-elevated/60 px-3 py-2 text-sm">
            {PRODUCT_CATALOGUE.map((p) => <option key={p.type} value={p.type}>{p.title} — KES {p.price}</option>)}
          </select>
          <button
            disabled={upsert.isPending}
            onClick={() => {
              const def = PRODUCT_CATALOGUE.find((p) => p.type === type)!;
              upsert.mutate({ product_type: def.type, title: def.title, price_kes: def.price, is_active: true });
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            List product
          </button>
        </div>
      </Card>

      <Card title="My listings">
        {products.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
          (products.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No products yet.</p> :
          <ul className="divide-y divide-border/60">
            {(products.data ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <span>{p.title}</span>
                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground">KES {Number(p.price_kes).toLocaleString()}</span>
                  <Tag label={p.is_active ? "Active" : "Paused"} tone={p.is_active ? "emerald" : "gold"} />
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => upsert.mutate({ id: p.id, product_type: p.product_type, title: p.title, price_kes: Number(p.price_kes), is_active: !p.is_active } as never)}
                  >
                    {p.is_active ? "Pause" : "Activate"}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        }
      </Card>

      <Card title="Recent sales">
        {(sales.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No sales yet.</p> :
          <ul className="divide-y divide-border/60">
            {(sales.data ?? []).map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                <span>{(s.data_products as { title?: string } | null)?.title ?? "Product"}</span>
                <span className="flex items-center gap-3">
                  <span className="text-emerald">+ KES {Number(s.amount_kes).toLocaleString()}</span>
                  <Tag label={s.status} tone={s.status === "active" ? "emerald" : "gold"} />
                </span>
              </li>
            ))}
          </ul>
        }
      </Card>
    </div>
  );
}
