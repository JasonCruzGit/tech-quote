"use client";

import BulletListEditor from "@/components/BulletListEditor";
import { inclusionLabels, reconcileInclusionLabels } from "@/lib/inclusions";
import type { InclusionLine } from "@/lib/types";

interface InclusionListEditorProps {
  items: InclusionLine[];
  onChange: (items: InclusionLine[]) => void;
  placeholder?: string;
  addLabel?: string;
  compact?: boolean;
}

export default function InclusionListEditor({
  items,
  onChange,
  placeholder = "Included item",
  addLabel = "Add line",
  compact = false,
}: InclusionListEditorProps) {
  return (
    <BulletListEditor
      items={inclusionLabels(items)}
      onChange={(labels) => onChange(reconcileInclusionLabels(items, labels))}
      placeholder={placeholder}
      addLabel={addLabel}
      compact={compact}
    />
  );
}
