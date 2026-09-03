"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import QuoteEditor from "@/components/editor/QuoteEditor";
import { useQuote, useQuotesLoadState } from "@/lib/store";

export default function QuoteEditorPage() {
  const params = useParams<{ id: string }>();
  const quote = useQuote(params.id);
  const loadState = useQuotesLoadState();

  if (!quote) {
    const isLoading = loadState === "loading" || loadState === "idle";
    return (
      <AppShell>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <p className="mb-4 text-slate-500">
            {isLoading ? "Loading quote..." : "Quote not found. It may have been deleted."}
          </p>
          {!isLoading && (
            <Link href="/" className="ui-link text-sm">
              ← Back to Quotes
            </Link>
          )}
        </main>
      </AppShell>
    );
  }

  return <QuoteEditor quote={quote} />;
}
