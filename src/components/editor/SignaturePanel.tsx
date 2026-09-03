"use client";

import type { PreparedBy } from "@/lib/types";

interface SignaturePanelProps {
  preparedBy: PreparedBy;
  onChange: (patch: Partial<PreparedBy>) => void;
}

export default function SignaturePanel({ preparedBy, onChange }: SignaturePanelProps) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ signatureDataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3.5">
        <div>
          <label className="ui-label">Name</label>
          <input
            value={preparedBy.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Preparer name"
            className="ui-input"
          />
        </div>
        <div>
          <label className="ui-label">Title</label>
          <input
            value={preparedBy.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Job title"
            className="ui-input"
          />
        </div>
        <div>
          <label className="ui-label">Signature image</label>
          {preparedBy.signatureDataUrl ? (
            <div className="mb-2 rounded-lg border border-[var(--line)] bg-[var(--surface-sub)] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preparedBy.signatureDataUrl}
                alt="Signature preview"
                className="h-14 object-contain"
              />
            </div>
          ) : (
            <p className="mb-2 text-xs text-[var(--ink-400)]">
              Optional — shown on the printed quotation
            </p>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="block w-full text-xs text-[var(--ink-500)] file:mr-3 file:rounded-md file:border file:border-[var(--line-strong)] file:bg-[var(--surface)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--ink-700)] hover:file:bg-[var(--surface-hover)]"
          />
          {preparedBy.signatureDataUrl && (
            <button
              type="button"
              onClick={() => onChange({ signatureDataUrl: undefined })}
              className="mt-2 text-xs font-semibold text-[var(--danger)] hover:underline"
            >
              Remove signature
            </button>
          )}
        </div>
      </div>
  );
}
