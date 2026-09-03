import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function RecordNotFound({
  isLoading,
  loadingLabel,
  missingLabel,
  backHref,
  backLabel,
}: {
  isLoading: boolean;
  loadingLabel: string;
  missingLabel: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <AppShell>
      <main className="ui-page flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--ink-500)]">
            {isLoading ? loadingLabel : missingLabel}
          </p>
          {!isLoading && (
            <Link href={backHref} className="ui-btn ui-btn-ghost mt-4">
              {backLabel}
            </Link>
          )}
        </div>
      </main>
    </AppShell>
  );
}
