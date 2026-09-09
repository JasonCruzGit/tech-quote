import { computeQuoteTotals, lineTotalPrice } from "@/lib/calc";
import { COMPANY, PRINT_GOLD } from "@/lib/company";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { RichText } from "@/lib/richText";
import type { LineItem, Quote } from "@/lib/types";

interface PrintableQuoteProps {
  quote: Quote;
}

function ContactIcon({ kind }: { kind: "pin" | "phone" | "mail" }) {
  return (
    <span className="flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white">
      {kind === "pin" ? (
        <svg width="8" height="8" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M8 1.6c-2.3 0-4.1 1.8-4.1 4.1 0 3.1 4.1 7.7 4.1 7.7s4.1-4.6 4.1-7.7C12.1 3.4 10.3 1.6 8 1.6z"
            fill="currentColor"
          />
          <circle cx="8" cy="5.7" r="1.35" fill="#2563EB" />
        </svg>
      ) : kind === "phone" ? (
        <svg width="7" height="7" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3.8 2.4l2.2.7c.25.08.4.32.36.57l-.35 1.9c-.03.18 0 .36.14.5l1.9 1.9c.14.14.32.17.5.14l1.9-.35c.25-.04.49.11.57.36l.7 2.2c.1.32-.1.65-.43.72l-1.4.35C6.6 13.1 2.9 9.4 4.1 5.7l.35-1.4c.07-.33.4-.53.72-.43z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg width="8" height="8" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M2.2 4.2h11.6v8.1H2.2V4.2zm0 0l5.8 4.2 5.8-4.2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function ItemBody({ item, index }: { item: LineItem; index: number }) {
  return (
    <>
      <div className="mb-0.5 text-[10.5px] leading-tight font-bold text-black">
        {index + 1}. {item.title.trim() || "Untitled item"}
      </div>
      {item.specs.length > 0 && (
        <ul className="space-y-px text-[9px] leading-snug text-[#374151]">
          {item.specs.map((spec, i) => {
            const trimmed = spec.trim();
            const isSubHeader =
              trimmed.endsWith(":") && trimmed.split(/\s+/).length <= 5;
            return (
              <li key={i} className={isSubHeader ? "mt-0.5 font-semibold text-[#111827]" : ""}>
                {!isSubHeader ? <span className="mr-1 text-[#9ca3af]">•</span> : null}
                <RichText text={spec} />
              </li>
            );
          })}
        </ul>
      )}
      {item.inclusions.length > 0 && (
        <div className="mt-0.5 text-[9px] leading-snug text-[#374151]">
          <div className="font-semibold text-[#111827]">Inclusion:</div>
          <ul className="space-y-px">
            {item.inclusions.map((inc, i) => (
              <li key={i}>
                <span className="mr-1 text-[#9ca3af]">•</span>
                <RichText text={inc} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {item.warranty.trim() ? (
        <div className="mt-0.5 text-[9px] text-[#6b7280] italic">{item.warranty}</div>
      ) : null}
    </>
  );
}

export default function PrintableQuote({ quote }: PrintableQuoteProps) {
  const totals = computeQuoteTotals(quote);
  const delivery = quote.terms.delivery.trim() || "—";
  const termBullets = [
    quote.terms.delivery.trim()
      ? `Delivery: ${quote.terms.delivery.trim()}`
      : null,
    quote.terms.payment.trim()
      ? `Payment: ${quote.terms.payment.trim()}`
      : null,
    quote.terms.warranty.trim() || null,
    quote.terms.pricesNote.trim() || null,
  ].filter(Boolean) as string[];

  return (
    <article className="tq-print-sheet print-page mx-auto w-full max-w-[210mm] bg-white px-7 pt-5 pb-5 text-[11px] text-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.12)] print:max-w-none print:shadow-none">
      {/* Header — logo left, name + stacked contacts right */}
      <header className="mb-3 flex items-start gap-3 border-b border-[#e5e7eb] pb-2.5">
        <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center bg-black p-[3px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/techcentrix-logo.png"
            alt={COMPANY.displayName}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1 font-serif">
          <h1 className="text-[18px] leading-none font-bold tracking-wide text-black uppercase">
            {COMPANY.legalName}
          </h1>
          <div className="mt-1.5 space-y-0.5 text-[10px] leading-snug text-black">
            <p className="flex items-start gap-1.5">
              <ContactIcon kind="pin" />
              <span>{COMPANY.address}</span>
            </p>
            <p className="flex items-start gap-1.5">
              <ContactIcon kind="phone" />
              <span>{COMPANY.phoneLine}</span>
            </p>
            <p className="flex items-start gap-1.5">
              <ContactIcon kind="mail" />
              <span className="italic">{COMPANY.email}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Client + Quotation meta */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <section className="overflow-hidden border border-[#111827]">
          <div
            className="bg-black px-2 py-1 text-[8.5px] font-bold tracking-[0.12em] uppercase"
            style={{ color: PRINT_GOLD }}
          >
            Client
          </div>
          <div className="space-y-px bg-white px-2 py-1.5 text-[10px] leading-snug">
            <p className="font-bold text-black">{quote.client.name.trim() || "—"}</p>
            {quote.client.office.trim() ? (
              <p className="font-medium text-[#374151]">{quote.client.office}</p>
            ) : null}
            <p className="text-[9.5px] text-[#6b7280]">
              {quote.client.address.trim() || "Address not set"}
            </p>
          </div>
        </section>

        <section className="overflow-hidden border border-[#111827]">
          <div
            className="bg-black px-2 py-1 text-[8.5px] font-bold tracking-[0.12em] uppercase"
            style={{ color: PRINT_GOLD }}
          >
            Quotation
          </div>
          <div className="space-y-0.5 bg-white px-2 py-1.5 text-[10px]">
            <div className="flex justify-between gap-2">
              <span className="font-bold text-black">QUOTE #</span>
              <span className="tabular-nums text-[#374151]">{quote.quoteNumber}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="font-bold text-black">DATE</span>
              <span className="text-[#374151]">{formatDateLong(quote.date)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="font-bold text-black">DELIVERY</span>
              <span className="max-w-[62%] text-right text-[9.5px] leading-snug text-[#374151]">
                {delivery}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Items */}
      <table className="mb-3 w-full border-collapse">
        <thead>
          <tr
            className="bg-black text-[8.5px] font-bold tracking-[0.06em] uppercase"
            style={{ color: PRINT_GOLD }}
          >
            <th className="w-8 px-1.5 py-1.5 text-left font-bold">I/N</th>
            <th className="px-1.5 py-1.5 text-left font-bold">Description</th>
            <th className="w-10 px-1.5 py-1.5 text-center font-bold">Qty</th>
            <th className="w-12 px-1.5 py-1.5 text-center font-bold">Unit</th>
            <th className="w-[76px] px-1.5 py-1.5 text-right font-bold">Unit Price</th>
            <th className="w-[84px] px-1.5 py-1.5 text-right font-bold">Total Price</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((item, index) => (
            <tr key={item.id} className="align-top border-b border-[#e5e7eb]">
              <td className="px-1.5 py-1.5 text-[9.5px] font-semibold tabular-nums text-[#6b7280]">
                {String(index + 1).padStart(2, "0")}
              </td>
              <td className="px-1.5 py-1.5">
                <ItemBody item={item} index={index} />
              </td>
              <td className="px-1.5 py-1.5 text-center text-[10px] tabular-nums text-[#374151]">
                {item.qty}
              </td>
              <td className="px-1.5 py-1.5 text-center text-[9.5px] text-[#374151]">
                {item.unit.trim() || "—"}
              </td>
              <td className="px-1.5 py-1.5 text-right text-[10px] tabular-nums text-[#374151]">
                {formatCurrency(item.unitPrice, false)}
              </td>
              <td className="px-1.5 py-1.5 text-right text-[10px] font-semibold tabular-nums text-black">
                {formatCurrency(lineTotalPrice(item), false)}
              </td>
            </tr>
          ))}
          {quote.items.length === 0 && (
            <tr>
              <td colSpan={6} className="px-1.5 py-8 text-center text-[10px] text-[#9ca3af]">
                No items added yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals — stay with content, no forced page break */}
      <div className="mb-3 flex justify-end">
        <table className="w-[230px] border-collapse border border-[#111827] text-[10px]">
          <tbody>
            <tr className="border-b border-[#e5e7eb]">
              <td className="bg-[#f9fafb] px-2 py-1.5 font-bold tracking-wide text-black uppercase">
                Subtotal
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums text-[#111827]">
                {formatCurrency(totals.subtotal, false)}
              </td>
            </tr>
            <tr className="border-b border-[#e5e7eb]">
              <td className="bg-[#f9fafb] px-2 py-1.5 font-bold tracking-wide text-black uppercase">
                {Math.round(quote.vatPct * 100)}% VAT
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums text-[#111827]">
                {formatCurrency(totals.vat, false)}
              </td>
            </tr>
            <tr>
              <td
                className="px-2 py-2 text-[11px] font-extrabold tracking-wide text-black uppercase"
                style={{ backgroundColor: PRINT_GOLD }}
              >
                Grand Total
              </td>
              <td
                className="px-2 py-2 text-right text-[11px] font-extrabold tabular-nums text-black"
                style={{ backgroundColor: PRINT_GOLD }}
              >
                {formatCurrency(totals.grandTotal, false)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Terms */}
      <section className="mb-4 overflow-hidden border border-[#111827]">
        <div
          className="bg-black px-2 py-1 text-[8.5px] font-bold tracking-[0.12em] uppercase"
          style={{ color: PRINT_GOLD }}
        >
          Terms and Conditions
        </div>
        <div className="bg-white px-2.5 py-2">
          {termBullets.length > 0 ? (
            <ul className="space-y-1 text-[9.5px] leading-snug text-[#374151]">
              {termBullets.map((line, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-black" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[9.5px] text-[#9ca3af]">No terms specified.</p>
          )}
        </div>
      </section>

      {/* Signature + footer */}
      <div className="flex items-end justify-between gap-4">
        <div className="w-44 text-center">
          <div className="mb-0.5 flex h-10 items-end justify-center">
            {quote.preparedBy.signatureDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={quote.preparedBy.signatureDataUrl}
                alt="Signature"
                className="max-h-10 max-w-full object-contain"
              />
            ) : null}
          </div>
          <div className="border-t border-black pt-1">
            <p className="text-[9.5px] font-bold text-black">
              {quote.preparedBy.name.trim() || "Authorized Signatory"}
            </p>
            <p className="text-[8.5px] text-[#6b7280]">
              {quote.preparedBy.title.trim() || "Authorized Signature"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-extrabold tracking-[0.06em] text-[#d1d5db] uppercase">
            {COMPANY.legalName}.
          </p>
          <p className="text-[8.5px] text-[#9ca3af]">TIN: {COMPANY.tin}</p>
        </div>
      </div>
    </article>
  );
}
