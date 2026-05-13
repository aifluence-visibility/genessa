import type { AdminNavIcon } from "@/lib/admin/navigation";

const iconClass = "h-[18px] w-[18px] shrink-0";

export function AdminNavIconGlyph({
  name,
  className = "",
}: {
  name: AdminNavIcon;
  className?: string;
}) {
  const c = `${iconClass} ${className}`.trim();
  switch (name) {
    case "dashboard":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "activity":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 19v-7M12 19V5M20 19v-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "leads":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.96 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
            fill="currentColor"
          />
        </svg>
      );
    case "audits":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 3h6v2H9V3zm0 4h6l1 14H8L9 7zm3 3v8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "proposals":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 3h7l3 3v15a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M14 3v4h4M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "sprints":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 10h18M9 5v15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "clients":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 20v-2a4 4 0 014-4h4a4 4 0 014 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "tasks":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "agents":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M4 20c1.2-3.5 4.2-6 8-6s6.8 2.5 8 6M16 11h3M17.5 9.5v3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "agent_runs":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 18H5a2 2 0 01-2-2V8a2 2 0 012-2h4M16 16l4-4-4-4M20 12H10"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "reports":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M15 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "approvals":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 11l3 3L22 4M2 12.5l4.5 4 3-3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
