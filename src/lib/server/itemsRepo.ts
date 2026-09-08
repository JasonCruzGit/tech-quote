import type { CatalogItem } from "@/lib/types";
import db, { schedulePersist } from "./db";

interface CatalogItemRow {
  id: string;
  title: string;
  specs: string;
  inclusions: string;
  warranty: string;
  unit: string;
  supplierCost: number;
  markupPct: number;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

function rowToItem(row: CatalogItemRow): CatalogItem {
  return {
    id: row.id,
    title: row.title,
    specs: JSON.parse(row.specs),
    inclusions: JSON.parse(row.inclusions),
    warranty: row.warranty,
    unit: row.unit,
    supplierCost: row.supplierCost,
    markupPct: row.markupPct,
    unitPrice: row.unitPrice,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function itemToRow(item: CatalogItem): CatalogItemRow {
  return {
    id: item.id,
    title: item.title,
    specs: JSON.stringify(item.specs),
    inclusions: JSON.stringify(item.inclusions),
    warranty: item.warranty,
    unit: item.unit,
    supplierCost: item.supplierCost,
    markupPct: item.markupPct,
    unitPrice: item.unitPrice,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function listCatalogItems(): CatalogItem[] {
  const rows = db
    .prepare("SELECT * FROM catalog_items ORDER BY updatedAt DESC")
    .all() as CatalogItemRow[];
  return rows.map(rowToItem);
}

export function getCatalogItemById(id: string): CatalogItem | undefined {
  const row = db.prepare("SELECT * FROM catalog_items WHERE id = ?").get(id) as
    | CatalogItemRow
    | undefined;
  return row ? rowToItem(row) : undefined;
}

export function insertCatalogItem(item: CatalogItem): CatalogItem {
  db.prepare(
    `INSERT INTO catalog_items
     (id, title, specs, inclusions, warranty, unit, supplierCost, markupPct, unitPrice, createdAt, updatedAt)
     VALUES (@id, @title, @specs, @inclusions, @warranty, @unit, @supplierCost, @markupPct, @unitPrice, @createdAt, @updatedAt)`
  ).run(itemToRow(item));
  schedulePersist();
  return item;
}

export function replaceCatalogItem(item: CatalogItem): CatalogItem | undefined {
  if (!getCatalogItemById(item.id)) return undefined;
  db.prepare(
    `UPDATE catalog_items SET
       title=@title, specs=@specs, inclusions=@inclusions, warranty=@warranty,
       unit=@unit, supplierCost=@supplierCost, markupPct=@markupPct, unitPrice=@unitPrice,
       updatedAt=@updatedAt
     WHERE id=@id`
  ).run(itemToRow(item));
  schedulePersist();
  return item;
}

export function removeCatalogItem(id: string): boolean {
  const result = db.prepare("DELETE FROM catalog_items WHERE id = ?").run(id);
  if (result.changes > 0) schedulePersist();
  return result.changes > 0;
}
