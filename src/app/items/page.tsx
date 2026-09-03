"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import ListPageChrome from "@/components/ui/ListPageChrome";
import RowMenu from "@/components/ui/RowMenu";
import SortableTh from "@/components/ui/SortableTh";
import StatStrip, { type Stat } from "@/components/ui/StatStrip";
import { PencilIcon } from "@/components/ui/Icons";
import { CreateButton, SearchInput } from "@/components/ui/Toolbar";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  createCatalogItem,
  deleteCatalogItem,
  useCatalogItems,
  useCatalogItemsLoadState,
} from "@/lib/itemsStore";
import { suggestedMarginPct, unitSellingPrice } from "@/lib/calc";
import { useTableSort } from "@/lib/useTableSort";

type ItemSortKey = "title" | "unit" | "supplierCost" | "margin" | "price";

export default function ItemsPage() {
  const items = useCatalogItems();
  const loadState = useCatalogItemsLoadState();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.specs.some((s) => s.toLowerCase().includes(q))
    );
  }, [items, query]);

  const rows = useMemo(
    () => filtered.map((item) => ({ item, price: item.unitPrice || unitSellingPrice(item) })),
    [filtered]
  );

  const { sorted, sort, toggle } = useTableSort<(typeof rows)[number], ItemSortKey>(
    rows,
    (row, key) => {
      switch (key) {
        case "title":
          return row.item.title;
        case "unit":
          return row.item.unit;
        case "supplierCost":
          return row.item.supplierCost;
        case "margin":
          return suggestedMarginPct(row.item);
        case "price":
          return row.price;
      }
    },
    { key: "title", dir: "asc" }
  );

  const stats: Stat[] = useMemo(() => {
    const priced = items.filter((i) => (i.unitPrice || unitSellingPrice(i)) > 0);
    const avgPrice =
      priced.length === 0
        ? 0
        : priced.reduce((sum, i) => sum + (i.unitPrice || unitSellingPrice(i)), 0) /
          priced.length;
    const avgMargin =
      priced.length === 0
        ? 0
        : priced.reduce((sum, i) => sum + suggestedMarginPct(i), 0) / priced.length;
    return [
      { label: "Catalog items", value: String(items.length) },
      { label: "Priced items", value: String(priced.length), hint: "Have a unit price set" },
      { label: "Average unit price", value: formatCurrency(avgPrice) },
      { label: "Average margin", value: formatPercent(avgMargin) },
    ];
  }, [items]);

  async function handleAddItem() {
    setIsCreating(true);
    try {
      const item = await createCatalogItem();
      router.push(`/items/${item.id}`);
    } catch (err) {
      console.error(err);
      window.alert("Failed to create item. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  function handleDelete(id: string, title: string) {
    const label = title.trim() || "Untitled item";
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      deleteCatalogItem(id);
    }
  }

  const isLoading = loadState === "loading" || loadState === "idle";

  return (
    <AppShell>
      <ListPageChrome
        title="List of Items"
        description="Reusable catalog of products and services used to build quotations."
        stats={<StatStrip stats={stats} />}
        toolbar={
          <>
            <SearchInput value={query} onChange={setQuery} placeholder="Search items" />
            <CreateButton onClick={handleAddItem} disabled={isCreating} label="New Item" />
          </>
        }
        cardMeta={
          <span className="ui-num text-xs text-[var(--ink-500)]">
            {filtered.length} of {items.length} items
          </span>
        }
      >
        <div className="ui-table-scroll">
          <table className="ui-table ui-table-fixed min-w-[860px]">
            <colgroup>
              <col />
              <col className="w-[84px]" />
              <col className="w-[140px]" />
              <col className="w-[104px]" />
              <col className="w-[140px]" />
              <col className="w-[84px]" />
            </colgroup>
            <thead>
              <tr>
                <SortableTh columnKey="title" label="Item" sort={sort} onSort={toggle} />
                <SortableTh columnKey="unit" label="Unit" sort={sort} onSort={toggle} />
                <SortableTh
                  columnKey="supplierCost"
                  label="Supplier Cost"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                  className="ui-num-cell"
                />
                <SortableTh
                  columnKey="margin"
                  label="Margin"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                  className="ui-num-cell"
                />
                <SortableTh
                  columnKey="price"
                  label="Unit Price"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                  className="ui-num-cell"
                />
                <th className="ui-col-actions text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ item, price }) => {
                const title = item.title.trim();
                return (
                  <tr key={item.id}>
                    <td>
                      <Link
                        href={`/items/${item.id}`}
                        className="ui-link block truncate"
                        title={title || "Untitled item"}
                      >
                        {title || (
                          <span className="font-normal text-[var(--ink-400)]">
                            Untitled item
                          </span>
                        )}
                      </Link>
                      <p className="ui-cell-sub">
                        {item.specs.length} spec{item.specs.length === 1 ? "" : "s"}
                        {item.inclusions.length > 0
                          ? ` · ${item.inclusions.length} inclusion${item.inclusions.length === 1 ? "" : "s"}`
                          : ""}
                      </p>
                    </td>
                    <td className="ui-truncate">{item.unit || "—"}</td>
                    <td className="ui-num-cell">{formatCurrency(item.supplierCost)}</td>
                    <td className="ui-num-cell">{formatPercent(suggestedMarginPct(item))}</td>
                    <td className="ui-num-cell ui-cell-strong">{formatCurrency(price)}</td>
                    <td className="ui-col-actions">
                      <div className="ui-row-actions">
                        <Link
                          href={`/items/${item.id}`}
                          className="ui-icon-btn ui-icon-btn-bare"
                          aria-label={`Edit ${title || "item"}`}
                          title="Edit item"
                        >
                          <PencilIcon size={14} />
                        </Link>
                        <RowMenu
                          actions={[
                            { key: "edit", label: "Edit item", href: `/items/${item.id}` },
                            {
                              key: "delete",
                              label: "Delete",
                              danger: true,
                              separated: true,
                              onSelect: () => handleDelete(item.id, item.title),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="!h-auto !p-0">
                    <EmptyState
                      title={
                        isLoading
                          ? "Loading items…"
                          : loadState === "error"
                            ? "Couldn't load items"
                            : query.trim()
                              ? "No items match your search"
                              : "No items yet"
                      }
                      description={
                        loadState === "error"
                          ? "Please refresh the page to try again."
                          : isLoading
                            ? undefined
                            : "Add products and services here to reuse them across quotations."
                      }
                      action={
                        loadState === "loaded" && !query.trim() ? (
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="ui-btn ui-btn-primary"
                          >
                            New Item
                          </button>
                        ) : null
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ListPageChrome>
    </AppShell>
  );
}
