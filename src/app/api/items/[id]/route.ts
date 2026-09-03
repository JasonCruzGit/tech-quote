import { NextResponse } from "next/server";
import {
  getCatalogItemById,
  removeCatalogItem,
  replaceCatalogItem,
} from "@/lib/server/itemsRepo";
import type { CatalogItem } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const item = getCatalogItemById(id);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  return NextResponse.json({ item });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as CatalogItem;
  if (body.id !== id) {
    return NextResponse.json({ error: "Item id mismatch" }, { status: 400 });
  }
  const updated = replaceCatalogItem({ ...body, updatedAt: new Date().toISOString() });
  if (!updated) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  if (!removeCatalogItem(id)) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
