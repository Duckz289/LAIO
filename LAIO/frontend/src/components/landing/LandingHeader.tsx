"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

type LandingHeaderProps = {
  onOpenAuth: () => void;
};

const navigation = [
  { label: "Tính năng", href: "#features" },
  { label: "Cách học", href: "#method" },
  { label: "Đánh giá", href: "#reviews" },
  { label: "FAQ", href: "#faq" },
];

export default function LandingHeader({ onOpenAuth }: LandingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 36);

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <header
      className={`landing-nav-enter fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        isScrolled || isMenuOpen
          ? "border-[#173f3420] bg-[#fffdf7] text-[#173f34]"
          : "border-transparent bg-[#aebd74] text-[#173f34]"
      }`}
    >
      <nav
        aria-label="Điều hướng chính"
        className="mx-auto flex h-[76px] max-w-[1180px] items-center justify-between px-5 sm:px-8"
      >
        <a
          href="#top"
          className="group inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-offset-4"
          aria-label="LAIO — về đầu trang"
        >
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#173f34] text-base font-black text-[#fff4c5] transition-transform duration-200 group-hover:-rotate-3">
            L
          </span>
          <span className="leading-none">
            <span className="block text-lg font-black tracking-[-0.03em]">LAIO</span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.18em] opacity-70">
              Learn all in one
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg text-sm font-bold transition-colors hover:text-[#f0513e]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={onOpenAuth}
            className="rounded-xl px-3 py-2 text-sm font-bold transition-colors hover:text-[#f0513e]"
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={onOpenAuth}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#173f34] px-5 py-3 text-sm font-black text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#0f3028]"
          >
            Bắt đầu học
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-expanded={isMenuOpen}
          aria-controls="landing-mobile-menu"
          aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
          className="grid h-11 w-11 place-items-center rounded-xl border border-[#173f3430] md:hidden"
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {isMenuOpen && (
        <div
          id="landing-mobile-menu"
          className="border-t border-[#173f3420] bg-[#fffdf7] px-5 pb-6 pt-3 md:hidden"
        >
          <div className="mx-auto flex max-w-[1180px] flex-col">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-bold hover:bg-[#f4efdf]"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenAuth();
              }}
              className="mt-3 rounded-full bg-[#173f34] px-5 py-3 text-sm font-black text-white"
            >
              Đăng nhập / Đăng ký
            </button>
          </div>
        </div>
      )}
    </header>
  );
}