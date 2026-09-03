interface IconProps {
  size?: number;
  className?: string;
}

function svgProps({ size = 14, className }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none" as const,
    "aria-hidden": true,
    className,
  };
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M2.5 4h11M4.5 8h7M6.5 12h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M8 2.5v7M5.25 7L8 9.75 10.75 7M3 13h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M8 2.5v7M10.75 7L8 4.25 5.25 7M3 3h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M9.75 3.5L5.5 8l4.25 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M6.25 3.5L10.5 8l-4.25 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M4 6.25L8 10.25l4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DotsIcon(props: IconProps) {
  const { size = 14, className } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <circle cx="8" cy="3.25" r="1.15" />
      <circle cx="8" cy="8" r="1.15" />
      <circle cx="8" cy="12.75" r="1.15" />
    </svg>
  );
}

/** Paired arrows; the active direction is highlighted by the caller. */
export function SortIcon({ direction, ...props }: IconProps & { direction?: "asc" | "desc" }) {
  return (
    <svg {...svgProps({ size: 11, ...props })} fill="currentColor">
      <path d="M8 1.5L11.25 5.5H4.75L8 1.5z" opacity={direction === "desc" ? 0.25 : 1} />
      <path d="M8 14.5L4.75 10.5h6.5L8 14.5z" opacity={direction === "asc" ? 0.25 : 1} />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M10.8 2.7l2.5 2.5M3 13h2.6l7.1-7.1a1.2 1.2 0 000-1.7l-.9-.9a1.2 1.2 0 00-1.7 0L3 10.4V13z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PrintIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M4.5 6V2.5h7V6M4.5 11.5H3.25A1.25 1.25 0 012 10.25v-3A1.25 1.25 0 013.25 6h9.5A1.25 1.25 0 0114 7.25v3a1.25 1.25 0 01-1.25 1.25H11.5M4.5 9.5h7v4h-7v-4z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M9.5 2.5H13.5V6.5M13.5 2.5L7.5 8.5M11.5 9.5v3a1 1 0 01-1 1h-7a1 1 0 01-1-1v-7a1 1 0 011-1h3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M2 9.5L3.75 3.5h8.5L14 9.5v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M2 9.5h3.5l.75 1.5h3.5l.75-1.5H14" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M6.5 8H14M11.5 5.5L14 8l-2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 3.5H4A1.5 1.5 0 002.5 5v6A1.5 1.5 0 004 12.5h5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
