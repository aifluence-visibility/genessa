import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-16 px-4 md:px-8 py-8 md:py-10">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
        <div className="flex items-center gap-4">
          <Logo size={22} />
          <div className="text-[13px] text-[var(--fg-3)]">© 2026 Genessa Inc.</div>
        </div>
        <div className="flex gap-6 text-[13px] text-[var(--fg-2)]">
          <Link href="#" className="no-underline font-medium text-[var(--fg-2)]">Privacy</Link>
          <Link href="#" className="no-underline font-medium text-[var(--fg-2)]">Terms</Link>
          <Link href="#" className="no-underline font-medium text-[var(--fg-2)]">Status</Link>
          <Link href="/contact" className="no-underline font-medium text-[var(--fg-2)]">Contact</Link>
          <Link href="/faq" className="no-underline font-medium text-[var(--fg-2)]">FAQ</Link>
        </div>
      </div>
    </footer>
  );
}
