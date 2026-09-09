import type { ReactNode } from "react";

/** Wrap the current selection with a markdown marker, or unwrap if already wrapped. */
export function wrapMarkdownSelection(
  value: string,
  start: number,
  end: number,
  marker: "**" | "*"
): { value: string; selectionStart: number; selectionEnd: number } {
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  const selected = value.slice(from, to);

  if (from === to) {
    const next = value.slice(0, from) + marker + marker + value.slice(to);
    const caret = from + marker.length;
    return { value: next, selectionStart: caret, selectionEnd: caret };
  }

  if (
    selected.startsWith(marker) &&
    selected.endsWith(marker) &&
    selected.length > marker.length * 2
  ) {
    const inner = selected.slice(marker.length, selected.length - marker.length);
    const next = value.slice(0, from) + inner + value.slice(to);
    return {
      value: next,
      selectionStart: from,
      selectionEnd: from + inner.length,
    };
  }

  // Avoid double-wrapping when markers already sit just outside the selection
  const before = value.slice(Math.max(0, from - marker.length), from);
  const after = value.slice(to, to + marker.length);
  if (before === marker && after === marker) {
    const next = value.slice(0, from - marker.length) + selected + value.slice(to + marker.length);
    return {
      value: next,
      selectionStart: from - marker.length,
      selectionEnd: from - marker.length + selected.length,
    };
  }

  const wrapped = `${marker}${selected}${marker}`;
  const next = value.slice(0, from) + wrapped + value.slice(to);
  return {
    value: next,
    selectionStart: from,
    selectionEnd: from + wrapped.length,
  };
}

/**
 * Parse a limited inline markdown subset: **bold** and *italic*.
 * Bold is matched first so ** does not collide with *.
 */
export function parseInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+?\*\*|\*[^*]+?\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={`b-${key++}`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      nodes.push(
        <em key={`i-${key++}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  if (nodes.length === 0) nodes.push(text);
  return nodes;
}

export function RichText({ text, className }: { text: string; className?: string }) {
  return <span className={className}>{parseInlineMarkdown(text)}</span>;
}
