import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicWebsiteSettings, WebsiteSettings } from "@/api/admin-api";

const ScissorsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
    <circle cx="4.5" cy="5.5"  r="2.6" stroke="white" strokeWidth="1.55" fill="rgba(255,255,255,0.2)" />
    <circle cx="4.5" cy="14.5" r="2.6" stroke="white" strokeWidth="1.55" fill="rgba(255,255,255,0.2)" />
    <path d="M6.9 7.1L18 3.4"   stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M6.9 12.9L18 16.6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M10.8 10L6.9 7.1"  stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M10.8 10L6.9 12.9" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const Footer = () => {
  const { data: settings } = useQuery<WebsiteSettings>({
    queryKey: ["website-settings-public"],
    queryFn: fetchPublicWebsiteSettings,
    staleTime: 60_000,
  });

  const footerText = settings?.footerText ?? "© 2026 SallonBoking.com. All rights reserved.";
  const supportEmail = settings?.supportEmail ?? "support@sallonboking.com";

  return (
    <footer className="bg-zinc-950 text-white pt-20 pb-12">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
        {/* Brand column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-4">
            {/* Icon mark */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 blur-sm opacity-40 scale-110" />
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                <ScissorsIcon />
              </div>
            </div>
            {/* Wordmark */}
            <div className="flex flex-col leading-none gap-[2px]">
              <div className="flex items-baseline gap-0">
                <span className="font-display text-base font-black tracking-tight text-white">Sallon</span>
                <span className="font-display text-base font-black tracking-tight text-gradient-gold">Boking</span>
                <span className="text-[0.55rem] font-semibold text-white/30 ml-0.5 self-end mb-px">.com</span>
              </div>
              <span className="text-[6.5px] tracking-[0.2em] text-white/25 uppercase font-semibold select-none">
                Luxury Salon Experience
              </span>
            </div>
          </div>
          <p className="text-sm text-white/50 leading-relaxed max-w-xs">
            Connecting customers with the best luxury salons and styling experiences near them.
          </p>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-6 text-sm text-white/80">Explore</h4>
          <div className="space-y-3">
            <Link to="/salons" className="block text-sm text-white/45 hover:text-white/80 transition-colors">Services</Link>
            <Link to="/" className="block text-sm text-white/45 hover:text-white/80 transition-colors">About Us</Link>
            <Link to="/" className="block text-sm text-white/45 hover:text-white/80 transition-colors">Gallery</Link>
          </div>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-6 text-sm text-white/80">For Professionals</h4>
          <div className="space-y-3">
            <Link to="/pricing" className="block text-sm text-white/45 hover:text-white/80 transition-colors">Partnership</Link>
            <Link to="/register" className="block text-sm text-white/45 hover:text-white/80 transition-colors">Join Our Team</Link>
          </div>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-6 text-sm text-white/80">Contact</h4>
          <div className="space-y-3">
            <a
              href={`mailto:${supportEmail}`}
              className="block text-sm text-white/45 hover:text-white/80 transition-colors"
            >
              {supportEmail}
            </a>
          </div>
        </div>
      </div>

      <div className="container mt-16 pt-8 border-t border-white/[0.07]">
        <p className="text-xs text-white/30 text-center">{footerText}</p>
      </div>
    </footer>
  );
};

export default Footer;
