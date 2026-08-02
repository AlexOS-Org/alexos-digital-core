import type { SVGProps } from "react";

type AlexOSLogoProps = SVGProps<SVGSVGElement> & {
  showWordmark?: boolean;
  compact?: boolean;
};

export function AlexOSLogo({
  showWordmark = false,
  compact = false,
  className,
  ...props
}: AlexOSLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className={compact ? "h-8 w-8" : "h-10 w-10"}
        {...props}
      >
        <defs>
          <linearGradient
            id="alexosLogoGradient"
            x1="6"
            y1="42"
            x2="42"
            y2="6"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--alexos-blue)" />
            <stop offset="1" stopColor="var(--alexos-purple)" />
          </linearGradient>

          <filter id="alexosLogoGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="48" height="48" rx="13" fill="var(--sidebar)" />

        <path
          d="M11 36 21 12h6l10 24h-6l-2.4-6H19.4L17 36h-6Zm10.6-11h3.8L23.5 20l-1.9 5Z"
          fill="url(#alexosLogoGradient)"
        />

        <g fill="url(#alexosLogoGradient)" filter="url(#alexosLogoGlow)">
          <circle cx="35" cy="10" r="1.8" />
          <circle cx="41" cy="17" r="1.2" />
          <circle cx="33" cy="22" r="1.1" />
        </g>

        <path
          d="M35 10 41 17 33 22"
          fill="none"
          stroke="url(#alexosLogoGradient)"
          strokeWidth="1"
          opacity=".8"
        />
      </svg>

      {showWordmark && (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold tracking-tight">AlexOS</div>
          <div className="truncate text-[9px] font-medium uppercase tracking-[0.2em] text-sidebar-foreground/60">
            Business OS
          </div>
        </div>
      )}
    </div>
  );
}
