import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

/* ── decorative SVGs ─────────────────────────────────────── */

const SparkleIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 12 12" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M6 0L7.35 4.65L12 6L7.35 7.35L6 12L4.65 7.35L0 6L4.65 4.65Z" />
  </svg>
);

const ScissorsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
    <circle cx="4.5" cy="5.5" r="2.6" stroke="white" strokeWidth="1.55" fill="rgba(255,255,255,0.2)" />
    <circle cx="4.5" cy="14.5" r="2.6" stroke="white" strokeWidth="1.55" fill="rgba(255,255,255,0.2)" />
    <path d="M6.9 7.1L18 3.4"  stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M6.9 12.9L18 16.6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M10.8 10L6.9 7.1"  stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M10.8 10L6.9 12.9" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/* ── nav links ───────────────────────────────────────────── */

const navLinks = [
  { href: "/",        label: "Home"     },
  { href: "/salons",  label: "Services" },
  { href: "/pricing", label: "Pricing"  },
  { href: "/login",   label: "Sign In"  },
];

/* pages whose top section is dark → navbar can be transparent at top */
const DARK_TOP_PATHS = ["/", "/salons", "/pricing"];

/* ── component ───────────────────────────────────────────── */

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hasDarkTop =
    DARK_TOP_PATHS.includes(location.pathname) ||
    location.pathname.startsWith("/salon/");

  const useGlass = scrolled || !hasDarkTop;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        useGlass ? "glass-dark" : "bg-transparent"
      }`}
    >
      {/* ── main bar ── */}
      <div className="container flex items-center justify-between h-16">

        {/* ── logo ── */}
        <Link to="/" className="flex items-center gap-3 group min-w-0">

          {/* icon mark */}
          <div className="relative flex-shrink-0">
            {/* outer glow halo */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 blur-md opacity-45 scale-110 group-hover:opacity-70 transition-opacity duration-300" />

            {/* icon square */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shimmer-sweep overflow-hidden">
              {/* specular highlight */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/28 to-transparent rounded-t-xl pointer-events-none" />
              <ScissorsIcon />
            </div>

            {/* floating sparkle */}
            <SparkleIcon className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-amber-300 animate-sparkle drop-shadow-sm" />

            {/* tiny dot lower-left */}
            <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-amber-400 border-2 border-zinc-900 shadow-sm" />
          </div>

          {/* wordmark */}
          <div className="flex flex-col leading-none gap-[3px]">
            <div className="flex items-baseline gap-0">
              <span className="font-display text-[1.1rem] font-black tracking-tight text-white">
                Sallon
              </span>
              <span className="font-display text-[1.1rem] font-black tracking-tight text-gradient-gold">
                Boking
              </span>
              <span className="font-display text-[0.6rem] font-semibold text-white/32 ml-0.5 tracking-tight self-end mb-px">
                .com
              </span>
            </div>
            <span className="text-[7.5px] tracking-[0.24em] text-white/28 uppercase font-semibold select-none">
              Luxury Salon Experience
            </span>
          </div>
        </Link>

        {/* ── desktop links ── */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`relative px-3.5 py-2 rounded-full text-[0.8125rem] font-medium transition-all duration-200 ${
                  active
                    ? "bg-white/14 text-white"
                    : "text-white/58 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
                {/* active indicator dot */}
                {active && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
                )}
              </Link>
            );
          })}

          {/* divider + CTA */}
          <div className="ml-3 pl-3 border-l border-white/10">
            <Link to="/register">
              <Button className="rounded-full px-5 h-9 text-[0.8125rem] font-semibold text-white bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 border-0 shadow-lg shadow-amber-600/20 transition-all duration-200 hover:scale-105">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* ── mobile toggle ── */}
        <button
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* gradient underline when scrolled */}
      {useGlass && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/45 to-transparent pointer-events-none" />
      )}

      {/* ── mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden glass-dark border-t border-white/10 px-4 py-3 space-y-1">
          {/* mini brand in mobile menu */}
          <div className="flex items-center gap-2 px-4 py-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                <circle cx="4.5" cy="5.5" r="2.6" stroke="white" strokeWidth="1.55" fill="rgba(255,255,255,0.2)" />
                <circle cx="4.5" cy="14.5" r="2.6" stroke="white" strokeWidth="1.55" fill="rgba(255,255,255,0.2)" />
                <path d="M6.9 7.1L18 3.4"  stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M6.9 12.9L18 16.6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M10.8 10L6.9 7.1"  stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M10.8 10L6.9 12.9" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xs font-bold text-white/50 tracking-wide">SallonBoking.com</span>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="block px-4 py-3 rounded-xl text-sm font-medium text-white/75 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-2 pb-1">
            <Link to="/register" onClick={() => setMobileOpen(false)}>
              <Button className="w-full rounded-full h-10 text-sm font-semibold text-white bg-gradient-to-br from-amber-400 to-amber-600 border-0 shadow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
