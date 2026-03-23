import { Scissors } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-secondary/50 border-t py-12">
    <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Scissors className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold">GlamBook</span>
        </div>
        <p className="text-sm text-muted-foreground">Connecting customers with the best salons near them.</p>
      </div>
      <div>
        <h4 className="font-display font-semibold mb-3 text-sm">For Customers</h4>
        <div className="space-y-2">
          <Link to="/salons" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Browse Salons</Link>
          <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
        </div>
      </div>
      <div>
        <h4 className="font-display font-semibold mb-3 text-sm">For Owners</h4>
        <div className="space-y-2">
          <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing Plans</Link>
          <Link to="/register" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Register</Link>
        </div>
      </div>
      <div>
        <h4 className="font-display font-semibold mb-3 text-sm">Contact</h4>
        <p className="text-sm text-muted-foreground">hello@glambook.com</p>
        <p className="text-sm text-muted-foreground">+94 77 123 4567</p>
      </div>
    </div>
    <div className="container mt-8 pt-6 border-t">
      <p className="text-xs text-muted-foreground text-center">© 2026 GlamBook. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
