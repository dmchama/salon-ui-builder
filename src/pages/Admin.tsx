import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  CreditCard,
  DollarSign,
  Globe,
  LayoutDashboard,
  Megaphone,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import Seo from "@/components/Seo";
import AppShell from "@/components/app-shell/AppShell";
import { PageHeader, SubTabs } from "@/components/app-shell/parts";
import CampaignRequestManager from "@/components/admin/CampaignRequestManager";
import SubscriptionManager from "@/components/admin/sections/Plans";
import AccountManager from "@/components/admin/sections/Accounts";
import BillingManager from "@/components/admin/sections/Billing";
import SystemStats from "@/components/admin/sections/Overview";
import SalonModeration from "@/components/admin/sections/Salons";
import WebsiteManager from "@/components/admin/sections/Website";
import { PromotionManager, CouponManager } from "@/components/admin/sections/Marketing";
import { clearAuth, getAccessToken, getStoredUser } from "@/lib/auth-storage";
import { ADMIN_SECTIONS, resolveSection, resolveSubTab, sectionPath } from "@/lib/app-sections";
import { fetchOwners } from "@/api/admin-api";

const SECTION_ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  accounts: Users,
  salons: Store,
  plans: CreditCard,
  billing: DollarSign,
  marketing: Megaphone,
  website: Globe,
};

const Admin = () => {
  const navigate = useNavigate();
  const { section: sectionParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const section = resolveSection(ADMIN_SECTIONS, sectionParam);
  const subTab = resolveSubTab(section, searchParams.get("tab"));
  const user = getStoredUser();
  const isAdmin = Boolean(getAccessToken()) && user?.role === "SUPER_ADMIN";

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      toast.info("Sign in as super admin.");
      navigate("/login", { replace: true });
      return;
    }
    if (stored.role !== "SUPER_ADMIN") {
      toast.error("Super admin access only.");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // Unknown section in the URL → back to overview (spec 004 AC9).
  useEffect(() => {
    if (sectionParam && sectionParam !== section.id) navigate(sectionPath("admin", section.id), { replace: true });
  }, [sectionParam, section.id, navigate]);

  // Pending payment reviews shown as a count next to Accounts (same query the Accounts table uses).
  const { data: owners } = useQuery({ queryKey: ["admin-owners"], queryFn: fetchOwners, enabled: isAdmin, staleTime: 30_000 });
  const pendingReviews = owners?.filter((o) => o.registrationPayment?.status === "PENDING").length ?? 0;

  const handleLogout = () => {
    clearAuth();
    toast.success("Signed out.");
    navigate("/login", { replace: true });
  };

  const renderSection = () => {
    switch (section.id) {
      case "overview":
        return <SystemStats />;
      case "accounts":
        return <AccountManager />;
      case "salons":
        return <SalonModeration />;
      case "plans":
        return <SubscriptionManager />;
      case "billing":
        return <BillingManager />;
      case "marketing":
        return (
          <>
            <SubTabs
              tabs={section.subTabs ?? []}
              value={subTab ?? "campaigns"}
              onChange={(id) => setSearchParams({ tab: id }, { replace: true })}
            />
            {subTab === "promotions" ? <PromotionManager /> : subTab === "coupons" ? <CouponManager /> : <CampaignRequestManager />}
          </>
        );
      case "website":
        return <WebsiteManager />;
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Seo title="System Admin" description="SaloonBooking system administration." path="/admin" noindex />
      <AppShell
        area="admin"
        caption="Admin"
        sections={ADMIN_SECTIONS}
        icons={SECTION_ICONS}
        activeId={section.id}
        badges={{ accounts: pendingReviews || undefined }}
        user={{ name: [user?.firstName, user?.lastName].filter(Boolean).join(" "), email: user?.email ?? "" }}
        onSignOut={handleLogout}
      >
        <PageHeader title={section.label} description={section.description} />
        {isAdmin && renderSection()}
      </AppShell>
    </motion.div>
  );
};

export default Admin;
