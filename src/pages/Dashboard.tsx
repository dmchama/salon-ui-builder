import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  LayoutDashboard,
  Megaphone,
  Scissors,
  Settings,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import AppShell from "@/components/app-shell/AppShell";
import { EmptyState, ErrorState, PageHeader, SectionSkeleton, SubTabs } from "@/components/app-shell/parts";
import SalonProfileEditor from "@/components/dashboard/SalonProfileEditor";
import ServiceManager from "@/components/dashboard/ServiceManager";
import BookingManager from "@/components/dashboard/BookingManager";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import TechnicianManager from "@/components/dashboard/TechnicianManager";
import PromotionSMS from "@/components/dashboard/PromotionSMS";
import CouponManager from "@/components/dashboard/CouponManager";
import PendingApprovalBanner from "@/components/dashboard/PendingApprovalBanner";
import OwnerOverview from "@/components/dashboard/OwnerOverview";
import BranchSwitcher from "@/components/dashboard/BranchSwitcher";
import AddBranchDialog from "@/components/dashboard/AddBranchDialog";
import { clearAuth, getAccessToken, getStoredUser } from "@/lib/auth-storage";
import { OWNER_SECTIONS, resolveSection, resolveSubTab, sectionPath } from "@/lib/app-sections";
import { fetchOwnerDashboard, fetchOwnerInsights } from "@/api/salon-owner-api";

const SECTION_ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  bookings: CalendarCheck,
  profile: Store,
  services: Scissors,
  team: Users,
  marketing: Megaphone,
  settings: Settings,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { section: sectionParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const section = resolveSection(OWNER_SECTIONS, sectionParam);
  const subTab = resolveSubTab(section, searchParams.get("tab"));
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const user = getStoredUser();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["owner-dashboard"],
    queryFn: fetchOwnerDashboard,
    enabled: Boolean(getAccessToken()),
  });

  const { data: insights } = useQuery({
    queryKey: ["owner-insights", selectedSalonId],
    queryFn: () => fetchOwnerInsights(selectedSalonId!),
    enabled: Boolean(selectedSalonId),
  });

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      toast.info("Sign in to open the owner dashboard.");
      navigate("/login", { replace: true });
      return;
    }
    if (stored.role !== "SALON_ADMIN") {
      toast.error("Only salon admins can access this dashboard.");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // Unknown section in the URL → back to overview (spec 004 AC9).
  useEffect(() => {
    if (sectionParam && sectionParam !== section.id) navigate(sectionPath("dashboard", section.id), { replace: true });
  }, [sectionParam, section.id, navigate]);

  useEffect(() => {
    if (!data?.salons.length) {
      setSelectedSalonId(null);
      return;
    }
    setSelectedSalonId((prev) => {
      if (prev && data.salons.some((s) => s.id === prev)) return prev;
      return data.salons[0].id;
    });
  }, [data?.salons]);

  const handleLogout = () => {
    clearAuth();
    toast.success("Signed out.");
    navigate("/login", { replace: true });
  };

  const selectedSalon = data?.salons.find((s) => s.id === selectedSalonId) ?? null;
  const pendingForSalon = selectedSalonId ? (insights?.pendingBySalonId[selectedSalonId] ?? 0) : 0;
  const maxSalons = data?.planLimits.maxSalons ?? 1;
  const canAddBranch = !!data && (maxSalons === -1 || data.salons.length < maxSalons);

  const noBranch = (
    <EmptyState
      icon={Store}
      title="Create your first branch"
      description="Add your salon's details to start taking bookings."
      action={
        <Button onClick={() => setAddBranchOpen(true)} disabled={!canAddBranch}>
          Add branch
        </Button>
      }
    />
  );

  const renderSection = () => {
    if (!data) return null;
    switch (section.id) {
      case "overview":
        return selectedSalon ? (
          <OwnerOverview data={data} salon={selectedSalon} insights={insights} pendingBookings={pendingForSalon} />
        ) : (
          noBranch
        );
      case "bookings":
        return <BookingManager salonId={selectedSalonId} />;
      case "profile":
        return <SalonProfileEditor salonId={selectedSalonId} />;
      case "services":
        return <ServiceManager salonId={selectedSalonId} />;
      case "team":
        return <TechnicianManager salonId={selectedSalonId} />;
      case "marketing":
        return (
          <>
            <SubTabs
              tabs={section.subTabs ?? []}
              value={subTab ?? "sms"}
              onChange={(id) => setSearchParams({ tab: id }, { replace: true })}
            />
            {subTab === "coupons" ? <CouponManager /> : <PromotionSMS salonId={selectedSalonId} />}
          </>
        );
      case "settings":
        return <SettingsPanel subscription={data.subscription} />;
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Seo title="Owner Dashboard" description="Manage your salon on SaloonBooking." path="/dashboard" noindex />
      <AppShell
        area="dashboard"
        caption="Owner portal"
        sections={OWNER_SECTIONS}
        icons={SECTION_ICONS}
        activeId={section.id}
        badges={{ bookings: pendingForSalon || undefined }}
        user={{
          name: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
          email: user?.email ?? "",
        }}
        onSignOut={handleLogout}
        headerRight={
          data ? (
            <BranchSwitcher
              salons={data.salons}
              selectedSalonId={selectedSalonId}
              onSelect={setSelectedSalonId}
              canAddBranch={canAddBranch}
              onAddBranch={() => setAddBranchOpen(true)}
            />
          ) : null
        }
      >
        <PageHeader title={section.label} description={section.description} />

        {isLoading && <SectionSkeleton />}
        {isError && (
          <ErrorState
            message={error instanceof Error ? error.message : "Could not load your dashboard."}
            onRetry={() => refetch()}
          />
        )}

        {data && !isLoading && (
          <div className="space-y-6">
            <PendingApprovalBanner />
            {renderSection()}
          </div>
        )}
      </AppShell>

      <AddBranchDialog
        open={addBranchOpen}
        onOpenChange={setAddBranchOpen}
        onCreated={(id) => {
          setSelectedSalonId(id);
          navigate(sectionPath("dashboard", "profile"));
        }}
      />
    </motion.div>
  );
};

export default Dashboard;
