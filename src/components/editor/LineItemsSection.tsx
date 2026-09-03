"use client";

import { PlusIcon } from "@/components/ui/Icons";
import { generateId } from "@/lib/id";
import type { LineItem } from "@/lib/types";
import LineItemCard from "./LineItemCard";

interface LineItemsSectionProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

function blankItem(): LineItem {
  return {
    id: generateId(),
    title: "",
    specs: [],
    inclusions: [],
    warranty: "at least 1 Year Warranty",
    qty: 1,
    unit: "unit",
    unitPrice: 0,
    priceManuallySet: false,
    supplierCost: 0,
    markupPct: 0.3,
  };
}

export default function LineItemsSection({ items, onChange }: LineItemsSectionProps) {
  function patchItem(id: string, patch: Partial<LineItem>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }

  function duplicateItem(id: string) {
    const idx = items.findIndex((it) => it.id === id);
    if (idx === -1) return;
    const copy: LineItem = { ...items[idx], id: generateId() };
    const next = [...items];
    next.splice(idx + 1, 0, copy);
    onChange(next);
  }

  function moveItem(id: string, direction: "up" | "down") {
    const idx = items.findIndex((it) => it.id === id);
    if (idx === -1) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= items.length) return;
    const next = [...items];
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
    onChange(next);
  }

  function addItem() {
    onChange([...items, blankItem()]);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="ui-num text-xs text-[var(--ink-500)]">
          {items.length} item{items.length === 1 ? "" : "s"}
        </p>
        <button type="button" onClick={addItem} className="ui-btn ui-btn-sm ui-btn-primary">
          <PlusIcon size={12} />
          Add product
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <LineItemCard
            key={item.id}
            index={index}
            item={item}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            onChange={(patch) => patchItem(item.id, patch)}
            onRemove={() => removeItem(item.id)}
            onDuplicate={() => duplicateItem(item.id)}
            onMove={(direction) => moveItem(item.id, direction)}
          />
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--surface-sub)] py-12 text-center">
            <p className="mb-1 text-sm font-semibold text-[var(--ink-800)]">No products yet</p>
            <p className="mb-4 text-xs text-[var(--ink-500)]">
              Add your first product or service to this quotation.
            </p>
            <button type="button" onClick={addItem} className="ui-btn ui-btn-primary">
              Add product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
