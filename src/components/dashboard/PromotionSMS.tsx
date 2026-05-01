import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  fetchOwnerCampaignCustomers,
  fetchOwnerCampaignServices,
  sendOwnerSmsCampaign,
  type OwnerCampaignService,
} from "@/api/salon-owner-api";

const SEGMENTS = [
  { value: "all", label: "All Customers" },
  { value: "regular", label: "Regular Customers (2+ bookings)" },
  { value: "last3months", label: "Booked in Last 3 Months" },
  { value: "last6months", label: "Booked in Last 6 Months" },
  { value: "last12months", label: "Booked in Last 12 Months" },
];

const mockHistory = [
  { id: 1, campaign: "Welcome Offer", recipients: 12, sent: 12, delivered: 11, date: "2026-04-10", status: "completed" },
  { id: 2, campaign: "Easter Promo", recipients: 8, sent: 8, delivered: 8, date: "2026-04-20", status: "completed" },
];

function buildMessage(opts: {
  discountPct: number;
  discountScope: string;
  selectedServices: OwnerCampaignService[];
  validFrom: string;
  validTo: string;
  customLink: string;
}): string {
  const { discountPct, discountScope, selectedServices, validFrom, validTo, customLink } = opts;
  if (!discountPct) return "";
  let serviceDesc = "all services";
  if (discountScope === "specific_service" && selectedServices.length === 1) {
    serviceDesc = selectedServices[0].name;
  } else if (discountScope === "multiple_services" && selectedServices.length > 0) {
    serviceDesc = selectedServices.map((s) => s.name).join(", ");
  }
  const period = validFrom && validTo ? ` Valid ${validFrom} to ${validTo}.` : "";
  const link = customLink ? ` Book: ${customLink}` : "";
  return `Hi! Special offer: Get ${discountPct}% off ${serviceDesc} at our salon!${period}${link}`;
}

interface Props {
  salonId: string | null;
}

const PromotionSMS = ({ salonId }: Props) => {
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [segment, setSegment] = useState("all");
  const [discountPct, setDiscountPct] = useState(10);
  const [discountScope, setDiscountScope] = useState<"all_services" | "specific_service" | "multiple_services">("all_services");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const { data: customersData, isFetching: loadingCustomers } = useQuery({
    queryKey: ["ownerCampaignCustomers", salonId, segment],
    queryFn: () => fetchOwnerCampaignCustomers(salonId!, segment),
    enabled: composeOpen && !!salonId,
  });

  const { data: allServices = [] } = useQuery({
    queryKey: ["ownerCampaignServices", salonId],
    queryFn: () => fetchOwnerCampaignServices(salonId!),
    enabled: composeOpen && !!salonId,
  });

  const selectedServices = allServices.filter((s) => selectedServiceIds.includes(s.id));

  useEffect(() => {
    const auto = buildMessage({ discountPct, discountScope, selectedServices, validFrom, validTo, customLink });
    setMessage(auto);
  }, [discountPct, discountScope, selectedServiceIds, validFrom, validTo, customLink, allServices]);

  const { mutate: doSend, isPending: sending } = useMutation({
    mutationFn: () => sendOwnerSmsCampaign({
      salonId: salonId!,
      campaignName,
      segment,
      discountPct,
      discountScope,
      serviceIds: selectedServiceIds,
      validFrom,
      validTo,
      customLink,
      message,
      scheduledAt: scheduledAt || undefined,
      recipientCount: customersData?.count ?? 0,
    }),
    onSuccess: (res) => {
      toast.success(`Campaign scheduled for ${res.recipientCount} recipients`);
      queryClient.invalidateQueries({ queryKey: ["ownerCampaignCustomers"] });
      setComposeOpen(false);
      setCampaignName(""); setSegment("all"); setDiscountPct(10);
      setDiscountScope("all_services"); setSelectedServiceIds([]);
      setValidFrom(""); setValidTo(""); setCustomLink(""); setMessage(""); setScheduledAt("");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to schedule campaign"),
  });

  const toggleService = (id: string) =>
    setSelectedServiceIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const recipientCount = customersData?.count ?? 0;

  if (!salonId) {
    return (
      <p className="text-sm text-muted-foreground py-8 tracking-wide">
        Select a salon above to manage SMS campaigns.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">SMS Campaigns</h2>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> New Campaign</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create SMS Campaign</DialogTitle></DialogHeader>
            <div className="space-y-5 pt-2 max-h-[75vh] overflow-y-auto pr-1">

              <div>
                <Label>Campaign Name</Label>
                <Input placeholder="e.g. April Offers" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>Target Audience</Label>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                  {loadingCustomers
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Loading…</>
                    : <><Users className="h-3 w-3" /> <span className="font-semibold">{recipientCount}</span> recipient{recipientCount !== 1 ? "s" : ""} matched</>}
                </p>
              </div>

              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium">Offer / Discount</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Discount %</Label>
                    <Input type="number" min={1} max={100} value={discountPct}
                      onChange={(e) => setDiscountPct(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-xs">Apply To</Label>
                    <Select value={discountScope} onValueChange={(v) => { setDiscountScope(v as any); setSelectedServiceIds([]); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_services">All Services</SelectItem>
                        <SelectItem value="specific_service">One Specific Service</SelectItem>
                        <SelectItem value="multiple_services">Multiple Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {discountScope !== "all_services" && (
                  <div>
                    <Label className="text-xs">Select Service{discountScope === "multiple_services" ? "s" : ""}</Label>
                    <div className="mt-1 max-h-36 overflow-y-auto rounded border divide-y">
                      {allServices.map((svc) => {
                        const checked = selectedServiceIds.includes(svc.id);
                        const isDisabled = discountScope === "specific_service" && selectedServiceIds.length === 1 && !checked;
                        return (
                          <label key={svc.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-muted/50 ${isDisabled ? "opacity-40 pointer-events-none" : ""}`}>
                            <Checkbox checked={checked} onCheckedChange={() => toggleService(svc.id)} />
                            <span className="flex-1">{svc.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Offer Valid From</Label>
                  <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Offer Valid To</Label>
                  <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Custom Booking Link</Label>
                <Input placeholder="https://glambook.lk/book" value={customLink} onChange={(e) => setCustomLink(e.target.value)} />
              </div>

              <div>
                <Label>SMS Message</Label>
                <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message auto-fills from offer details above…" />
                <p className="text-xs text-muted-foreground mt-1">{message.length}/160 characters</p>
              </div>

              <div>
                <Label>Schedule Send (optional)</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Leave blank to send immediately</p>
              </div>

              <Button className="w-full" disabled={sending || !campaignName || !message || recipientCount === 0} onClick={() => doSend()}>
                {sending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Scheduling…</>
                  : `Send to ${recipientCount} Recipient${recipientCount !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockHistory.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.campaign}</TableCell>
                <TableCell>{s.recipients}</TableCell>
                <TableCell>{s.sent}</TableCell>
                <TableCell>{s.delivered}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.date}</TableCell>
                <TableCell><Badge variant={s.status === "completed" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default PromotionSMS;
