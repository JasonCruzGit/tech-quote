import type { ReactNode } from "react";

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convert stored markdown into HTML for a contenteditable line. */
export function markdownToHtml(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function isBoldElement(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === "strong" || tag === "b") return true;
  const weight = el.style.fontWeight || "";
  if (weight === "bold" || weight === "bolder") return true;
  const n = Number(weight);
  return Number.isFinite(n) && n >= 600;
}

function isItalicElement(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === "em" || tag === "i") return true;
  return el.style.fontStyle === "italic";
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent || "").replace(/\u00a0/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === "br") return "\n";

  const inner = Array.from(el.childNodes).map(serializeNode).join("");
  if (!inner) return "";

  let out = inner;
  if (isItalicElement(el)) out = `*${out}*`;
  if (isBoldElement(el)) out = `**${out}**`;
  return out;
}

/** Convert contenteditable HTML back to markdown for storage. */
export function htmlToMarkdown(html: string): string {
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;
  return Array.from(root.childNodes).map(serializeNode).join("");
}
