import { NextResponse } from "next/server";
import { generateId } from "@/lib/id";
import { insertCatalogItem, listCatalogItems } from "@/lib/server/itemsRepo";
import type { CatalogItem } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ items: listCatalogItems() });
}

export async function POST() {
  const now = new Date().toISOString();
  const item: CatalogItem = {
    id: generateId(),
    title: "",
    specs: [],
    inclusions: [],
    warranty: "at least 1 Year Warranty",
    unit: "unit",
    supplierCost: 0,
    markupPct: 0.3,
    unitPrice: 0,
    createdAt: now,
    updatedAt: now,
  };
  insertCatalogItem(item);
  return NextResponse.json({ item }, { status: 201 });
}
