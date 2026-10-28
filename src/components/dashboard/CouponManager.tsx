import { Ticket } from "lucide-react";
import { EmptyState, Panel } from "@/components/app-shell/parts";

const CouponManager = () => (
  <Panel>
    <EmptyState
      icon={Ticket}
      title="Coupons aren't available yet"
      description="Discount codes and coupons are not implemented in the API yet. Pricing is controlled per service under Services."
    />
  </Panel>
);

export default CouponManager;
