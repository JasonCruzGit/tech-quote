"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import BulletListEditor from "@/components/BulletListEditor";
import PageHeader from "@/components/ui/PageHeader";
import RecordNotFound from "@/components/ui/RecordNotFound";
import SaveIndicator from "@/components/ui/SaveIndicator";
import SectionCard from "@/components/ui/SectionCard";
import { suggestedMarginPct, unitSellingPrice } from "@/lib/calc";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  deleteCatalogItem,
  updateCatalogItem,
  useCatalogItem,
  useCatalogItemsLoadState,
  useCatalogSavingStatus,
} from "@/lib/itemsStore";

function numberInputProps(value: number, onValue: (v: number) => void) {
  return {
    value: Number.isFinite(value) ? value : 0,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onValue(parseFloat(e.target.value) || 0),
    type: "number" as const,
    step: "0.01",
  };
}

export default function ItemEditorPage() {
  const params = useParams<{ id: string }>();
  const item = useCatalogItem(params.id);
  const loadState = useCatalogItemsLoadState();
  const isSaving = useCatalogSavingStatus();
  const router = useRouter();

  if (!item) {
    return (
      <RecordNotFound
        isLoading={loadState === "loading" || loadState === "idle"}
        loadingLabel="Loading item…"
        missingLabel="Item not found. It may have been deleted."
        backHref="/items"
        backLabel="Back to List of Items"
      />
    );
  }

  const current = item;

  function patch(partial: Partial<typeof current>) {
    updateCatalogItem(current.id, (c) => ({ ...c, ...partial }));
  }

  function handleDelete() {
    const label = current.title.trim() || "Untitled item";
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      deleteCatalogItem(current.id);
      router.push("/items");
    }
  }

  const usp = unitSellingPrice(current);
  const suggested = suggestedMarginPct(current);

  return (
    <AppShell>
      <main className="ui-page">
        <div className="ui-page-inner-narrow">
          <PageHeader
            eyebrow="Catalog item"
            title={current.title.trim() || "New Item"}
            actions={
              <>
                <SaveIndicator isSaving={isSaving} />
                <Link href="/items" className="ui-btn ui-btn-ghost">
                  Back
                </Link>
                <button type="button" onClick={handleDelete} className="ui-btn ui-btn-danger">
                  Delete
                </button>
              </>
            }
          />

          <div className="space-y-4">
            <SectionCard
              title="Details"
              description="Item title, description, inclusions, warranty, and unit of measure."
            >
              <label className="ui-label">Item title</label>
              <input
                value={current.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="e.g. FIELD MONITOR"
                className="ui-input !h-10 !text-[15px] !font-semibold"
              />

              <div className="mt-5">
                <label className="ui-label">Description</label>
                <BulletListEditor
                  items={current.specs}
                  onChange={(specs) => patch({ specs })}
                  placeholder="Description detail"
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="ui-label">Inclusions</label>
                  <BulletListEditor
                    items={current.inclusions}
                    onChange={(inclusions) => patch({ inclusions })}
                    placeholder="Included item"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="ui-label">Warranty</label>
                    <input
                      value={current.warranty}
                      onChange={(e) => patch({ warranty: e.target.value })}
                      className="ui-input"
                    />
                  </div>
                  <div>
                    <label className="ui-label">Unit</label>
                    <input
                      value={current.unit}
                      onChange={(e) => patch({ unit: e.target.value })}
                      className="ui-input"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Costing defaults"
              description="Supplier cost, markup, and the default unit price applied in quotations."
              headerRight={
                <span className="ui-badge ui-badge-neutral">
                  Margin {formatPercent(suggested)}
                </span>
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="ui-label">Supplier cost (VAT exclusive)</label>
                  <input
                    {...numberInputProps(current.supplierCost, (supplierCost) =>
                      patch({ supplierCost })
                    )}
                    className="ui-input ui-num"
                  />
                </div>
                <div>
                  <label className="ui-label">Markup %</label>
                  <input
                    {...numberInputProps(current.markupPct * 100, (v) =>
                      patch({ markupPct: v / 100 })
                    )}
                    className="ui-input ui-num"
                  />
                </div>
                <div>
                  <label className="ui-label">Suggested unit selling</label>
                  <div className="ui-input-readonly ui-num">{formatCurrency(usp)}</div>
                  <button
                    type="button"
                    onClick={() => patch({ unitPrice: usp })}
                    className="mt-1.5 text-xs font-semibold text-[var(--brand)] hover:underline"
                  >
                    Apply as unit price
                  </button>
                </div>
                <div>
                  <label className="ui-label">Unit price</label>
                  <input
                    {...numberInputProps(current.unitPrice, (unitPrice) =>
                      patch({ unitPrice })
                    )}
                    className="ui-input ui-num !font-semibold"
                  />
                  <p className="mt-1.5 text-xs text-[var(--ink-400)]">
                    Suggested margin {formatPercent(suggested)}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
