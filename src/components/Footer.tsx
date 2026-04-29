import { Scissors } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicWebsiteSettings, WebsiteSettings } from "@/api/admin-api";

const Footer = () => {
  const { data: settings } = useQuery<WebsiteSettings>({
    queryKey: ["website-settings-public"],
    queryFn: fetchPublicWebsiteSettings,
    staleTime: 60_000,
  });

  const footerText = settings?.footerText ?? "© 2026 GlamBook. All rights reserved.";
  const supportEmail = settings?.supportEmail ?? "support@glambook.com";

  return (
    <footer className="bg-black text-white pt-20 pb-12 border-t border-white/10">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Scissors className="h-6 w-6 text-gold" />
            <span className="font-display text-2xl font-bold tracking-widest uppercase">GlamBook</span>
          </div>
          <p className="text-sm text-white/60 font-light leading-relaxed max-w-xs">Connecting customers with the best luxury salons and styling experiences near them.</p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-6 tracking-widest uppercase text-sm">Explore</h4>
          <div className="space-y-4">
            <Link to="/salons" className="block text-sm text-white/60 hover:text-gold transition-colors">Services</Link>
            <Link to="/" className="block text-sm text-white/60 hover:text-gold transition-colors">About Us</Link>
            <Link to="/" className="block text-sm text-white/60 hover:text-gold transition-colors">Gallery</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-6 tracking-widest uppercase text-sm">For Professionals</h4>
          <div className="space-y-4">
            <Link to="/pricing" className="block text-sm text-white/60 hover:text-gold transition-colors">Partnership</Link>
            <Link to="/register" className="block text-sm text-white/60 hover:text-gold transition-colors">Join Our Team</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-6 tracking-widest uppercase text-sm">Contact Us</h4>
          <div className="space-y-4">
            <a href={`mailto:${supportEmail}`} className="block text-sm text-white/60 hover:text-gold transition-colors">{supportEmail}</a>
          </div>
        </div>
      </div>
      <div className="container mt-16 pt-8 border-t border-white/10">
        <p className="text-xs text-white/40 text-center tracking-wider">{footerText}</p>
      </div>
    </footer>
  );
};

export default Footer;
