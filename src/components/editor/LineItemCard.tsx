"use client";

import { useState } from "react";
import BulletListEditor from "@/components/BulletListEditor";
import { ChevronDownIcon } from "@/components/ui/Icons";
import {
  lineTotalPrice,
  markupAmount,
  marginPct,
  suggestedMarginPct,
  totalCost,
  totalSellingPrice,
  unitSellingPrice,
} from "@/lib/calc";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { LineItem } from "@/lib/types";

interface LineItemCardProps {
  index: number;
  item: LineItem;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<LineItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMove: (direction: "up" | "down") => void;
}

function numberInputProps(value: number, onValue: (v: number) => void) {
  return {
    value: Number.isFinite(value) ? value : 0,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onValue(parseFloat(e.target.value) || 0),
    type: "number" as const,
    step: "0.01",
  };
}

function CostStat({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-white px-3 py-2">
      <p className="text-[10px] font-semibold tracking-wide text-[var(--ink-400)] uppercase">
        {label}
      </p>
      <p
        className={`ui-num mt-0.5 text-sm font-semibold tabular-nums ${
          danger
            ? "text-[var(--danger)]"
            : highlight
              ? "text-[var(--ok)]"
              : "text-[var(--ink-800)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function LineItemCard({
  index,
  item,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
}: LineItemCardProps) {
  const [costingOpen, setCostingOpen] = useState(false);

  const usp = unitSellingPrice(item);
  const suggestedMargin = suggestedMarginPct(item);
  const actualMargin = marginPct(item);
  const total = lineTotalPrice(item);

  return (
    <article className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-3.5">
        <div className="ui-num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--ink-900)] text-[11px] font-bold text-white">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={item.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Item title"
            className="ui-input !h-auto !border-transparent !bg-transparent !px-0 !py-0.5 !text-[15px] !font-semibold !tracking-tight hover:!bg-[var(--surface-hover)] focus:!border-[var(--brand)] focus:!bg-white focus:!px-2"
          />
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-[10px] font-semibold tracking-wide text-[var(--ink-400)] uppercase">
            Line total
          </p>
          <p className="ui-num text-base font-bold tabular-nums text-[var(--ink-900)]">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onMove("up")}
            className="ui-icon-btn"
            title="Move up"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 3.5v7M4 6.5l3-3 3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onMove("down")}
            className="ui-icon-btn"
            title="Move down"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 10.5v-7M4 7.5l3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button type="button" onClick={onDuplicate} className="ui-icon-btn" title="Duplicate item">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <rect x="5" y="5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M9 5V3.2A1.2 1.2 0 007.8 2H3.2A1.2 1.2 0 002 3.2v4.6A1.2 1.2 0 003.2 9H5"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="ui-icon-btn ui-icon-btn-danger"
            title="Remove item"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M3 4h8M5.5 4V3h3v1M5 6.5v4M7 6.5v4M9 6.5v4M4 4l.5 7h5L10 4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Pricing */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <label className="ui-label">Qty</label>
            <input {...numberInputProps(item.qty, (qty) => onChange({ qty }))} className="ui-input ui-input-compact" />
          </div>
          <div>
            <label className="ui-label">Unit</label>
            <input
              value={item.unit}
              onChange={(e) => onChange({ unit: e.target.value })}
              placeholder="unit"
              className="ui-input ui-input-compact"
            />
          </div>
          <div>
            <label className="ui-label">Unit price</label>
            <input
              {...numberInputProps(item.unitPrice, (unitPrice) =>
                onChange({ unitPrice, priceManuallySet: true })
              )}
              className="ui-input ui-input-compact !font-medium tabular-nums"
            />
          </div>
          <div>
            <label className="ui-label">Total price</label>
            <div className="ui-input-readonly ui-input-compact tabular-nums">{formatCurrency(total)}</div>
          </div>
        </div>

        {/* Product details */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="ui-label">Description</label>
            <BulletListEditor
              items={item.specs}
              onChange={(specs) => onChange({ specs })}
              placeholder="Specification line"
              compact
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="ui-label">Inclusions</label>
              <BulletListEditor
                items={item.inclusions}
                onChange={(inclusions) => onChange({ inclusions })}
                placeholder="Included item"
                compact
              />
            </div>
            <div>
              <label className="ui-label">Warranty</label>
              <input
                value={item.warranty}
                onChange={(e) => onChange({ warranty: e.target.value })}
                placeholder="Warranty terms"
                className="ui-input ui-input-compact"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Internal costing */}
      <div className="border-t border-[var(--line)] bg-[var(--surface-sub)]">
        <button
          type="button"
          onClick={() => setCostingOpen((v) => !v)}
          aria-expanded={costingOpen}
          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
        >
          <span className="text-xs font-semibold text-[var(--ink-700)]">
            Internal costing
            <span className="ml-1.5 font-normal text-[var(--ink-400)]">· not shown on quote</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span
              className={`ui-badge text-[10px] ${actualMargin >= 0 ? "ui-badge-ok" : "ui-badge-danger"}`}
            >
              {formatPercent(actualMargin)} margin
            </span>
            <ChevronDownIcon
              size={14}
              className={`text-[var(--ink-400)] transition-transform ${costingOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {costingOpen && (
          <div className="space-y-3 border-t border-[var(--line)] px-4 pt-3 pb-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <label className="ui-label">Supplier cost</label>
                <input
                  {...numberInputProps(item.supplierCost, (supplierCost) => onChange({ supplierCost }))}
                  className="ui-input ui-input-compact tabular-nums"
                />
              </div>
              <div>
                <label className="ui-label">Markup %</label>
                <input
                  {...numberInputProps(item.markupPct * 100, (v) => onChange({ markupPct: v / 100 }))}
                  className="ui-input ui-input-compact tabular-nums"
                />
              </div>
              <button
                type="button"
                onClick={() => onChange({ unitPrice: usp, priceManuallySet: true })}
                className="ui-btn ui-btn-sm ui-btn-ghost h-8 whitespace-nowrap"
              >
                Apply unit price
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <CostStat label="Unit selling" value={formatCurrency(usp)} />
              <CostStat label="Total cost" value={formatCurrency(totalCost(item))} />
              <CostStat label="Markup" value={formatCurrency(markupAmount(item))} />
              <CostStat
                label="Actual margin"
                value={formatPercent(actualMargin)}
                highlight={actualMargin >= 0}
                danger={actualMargin < 0}
              />
            </div>

            <p className="text-[11px] text-[var(--ink-400)]">
              Suggested margin at current markup: {formatPercent(suggestedMargin)} · Total selling:{" "}
              {formatCurrency(totalSellingPrice(item))}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
