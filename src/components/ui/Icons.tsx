import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const BagIcon = (p: P) => (
  <Base {...p}>
    <path d="M5.5 8h13l-1 11.2a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3L5.5 8Z" />
    <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
  </Base>
);
export const PlusIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);
export const MinusIcon = (p: P) => (
  <Base {...p}>
    <path d="M5 12h14" />
  </Base>
);
export const CheckIcon = (p: P) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
);
export const CloseIcon = (p: P) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);
export const MenuIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 8h16M4 16h10" />
  </Base>
);
/** Points to the reading direction's "forward" in RTL (left). */
export const ArrowIcon = (p: P) => (
  <Base {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Base>
);
export const TrashIcon = (p: P) => (
  <Base {...p}>
    <path d="M4.5 7h15M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7M6.5 7l.8 11.6a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
  </Base>
);
export const CopyIcon = (p: P) => (
  <Base {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
  </Base>
);
export const PhoneIcon = (p: P) => (
  <Base {...p}>
    <path d="M6.6 3.8 9 4.4l1.2 3.7-1.9 1.5a11 11 0 0 0 6.1 6.1l1.5-1.9 3.7 1.2.6 2.4a1.6 1.6 0 0 1-1.5 2A16.6 16.6 0 0 1 4.6 5.3a1.6 1.6 0 0 1 2-1.5Z" />
  </Base>
);
export const WhatsappIcon = ({ size = 20, ...rest }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...rest}>
    <path
      fill="currentColor"
      d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.17-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.06a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.07.89.9-2.99-.2-.31a8.17 8.17 0 1 1 6.85 3.74Zm4.49-6.12c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.96-.14.17-.29.19-.53.06-.25-.12-1.04-.38-1.98-1.22a7.4 7.4 0 0 1-1.37-1.7c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47a.9.9 0 0 0-.66.31 2.77 2.77 0 0 0-.86 2.06c0 1.22.89 2.39 1.01 2.56.12.16 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.6.19 1.13.16 1.56.1.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.47-.29Z"
    />
  </svg>
);
export const InstagramIcon = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
  </Base>
);
export const TiktokIcon = (p: P) => (
  <Base {...p}>
    <path d="M14 3.5v11.2a3.8 3.8 0 1 1-3.8-3.8" />
    <path d="M14 3.5c.4 2.6 2.2 4.3 4.8 4.5" />
  </Base>
);
export const FacebookIcon = (p: P) => (
  <Base {...p}>
    <path d="M14.5 8.5H16V5.6a17 17 0 0 0-2.2-.1c-2.2 0-3.6 1.3-3.6 3.8v2.2H7.8v3.2h2.4V21h3V14.7h2.4l.4-3.2h-2.8V9.6c0-.9.3-1.1 1.3-1.1Z" />
  </Base>
);
export const SnapchatIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 3.5c2.8 0 4.6 2 4.6 4.6v2.3l1.6-.3c.5 0 .6.6.2.9l-1.7 1c.4 1.6 1.8 2.9 3.3 3.3-.3.7-1.4 1-2.4 1.1l-.4 1.2c-1-.2-2-.2-2.8.3-.9.6-1.6 1.1-2.4 1.1s-1.5-.5-2.4-1.1c-.8-.5-1.8-.5-2.8-.3l-.4-1.2c-1-.1-2.1-.4-2.4-1.1 1.5-.4 2.9-1.7 3.3-3.3l-1.7-1c-.4-.3-.3-.9.2-.9l1.6.3V8.1C7.4 5.5 9.2 3.5 12 3.5Z" />
  </Base>
);
export const ClockIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);
export const PinIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </Base>
);
export const TruckIcon = (p: P) => (
  <Base {...p}>
    <path d="M3.5 6.5h10v9h-10zM13.5 9.5h3.7l2.3 2.8v3.2h-6" />
    <circle cx="7" cy="17" r="1.6" />
    <circle cx="16.5" cy="17" r="1.6" />
  </Base>
);
export const SearchIcon = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Base>
);
export const ChevronIcon = (p: P) => (
  <Base {...p}>
    <path d="m6 9 6 6 6-6" />
  </Base>
);
export const SpinnerIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" fill="none" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);
