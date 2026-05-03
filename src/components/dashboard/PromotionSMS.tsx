import { useState, useEffect, useRef } from "react";
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
import { Plus, Loader2, Users, Upload, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  fetchOwnerCampaignCustomers,
  fetchOwnerCampaignServices,
  fetchOwnerCampaignHistory,
  fetchOwnerSmsCampaignPrice,
  submitOwnerCampaignRequest,
  type OwnerCampaignService,
  type CampaignHistoryRow,
} from "@/api/salon-owner-api";

const SEGMENTS = [
  { value: "all", label: "All Customers" },
  { value: "regular", label: "Regular Customers (2+ bookings)" },
  { value: "last3months", label: "Booked in Last 3 Months" },
  { value: "last6months", label: "Booked in Last 6 Months" },
  { value: "last12months", label: "Booked in Last 12 Months" },
];

function buildMessage(opts: {
  discountPct: number;
  discountScope: string;
  selectedServices: OwnerCampaignService[];
  validFrom: string;
  validTo: string;
}): string {
  const { discountPct, discountScope, selectedServices, validFrom, validTo } = opts;
  if (!discountPct) return "";
  let serviceDesc = "all services";
  if (discountScope === "specific_service" && selectedServices.length === 1) {
    serviceDesc = selectedServices[0].name;
  } else if (discountScope === "multiple_services" && selectedServices.length > 0) {
    serviceDesc = selectedServices.map((s) => s.name).join(", ");
  }
  const period = validFrom && validTo ? ` Valid ${validFrom} to ${validTo}.` : "";
  return `Hi! Special offer: Get ${discountPct}% off ${serviceDesc} at our salon!${period} Use the link below to book with discount applied.`;
}

function StatusBadge({ status }: { status: CampaignHistoryRow["status"] }) {
  if (status === "APPROVED") return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
  return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
}

interface Props {
  salonId: string | null;
}

const PromotionSMS = ({ salonId }: Props) => {
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const [campaignName, setCampaignName] = useState("");
  const [segment, setSegment] = useState("all");
  const [discountPct, setDiscountPct] = useState(10);
  const [discountScope, setDiscountScope] = useState<"all_services" | "specific_service" | "multiple_services">("all_services");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const { data: priceData } = useQuery<{ priceCents: number }>({
    queryKey: ["ownerSmsCampaignPrice"],
    queryFn: fetchOwnerSmsCampaignPrice,
  });

  const { data: campaignHistory = [] } = useQuery({
    queryKey: ["ownerCampaignHistory", salonId],
    queryFn: () => fetchOwnerCampaignHistory(salonId!),
    enabled: !!salonId,
  });

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
    const auto = buildMessage({ discountPct, discountScope, selectedServices, validFrom, validTo });
    setMessage(auto);
  }, [discountPct, discountScope, selectedServiceIds, validFrom, validTo, allServices]);

  const recipientCount = customersData?.count ?? 0;
  const perSmsPriceCents = priceData?.priceCents ?? 0;
  const totalPriceCents = perSmsPriceCents * recipientCount;

  const { mutate: doSubmit, isPending: submitting } = useMutation({
    mutationFn: () => submitOwnerCampaignRequest({
      salonId: salonId!,
      campaignName,
      segment,
      discountPct,
      discountScope,
      serviceIds: selectedServiceIds,
      validFrom,
      validTo,
      message,
      scheduledAt: scheduledAt || undefined,
      recipientCount,
      receipt: receiptFile ?? undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownerCampaignHistory", salonId] });
      setComposeOpen(false);
      setSuccessOpen(true);
      setCampaignName(""); setSegment("all"); setDiscountPct(10);
      setDiscountScope("all_services"); setSelectedServiceIds([]);
      setValidFrom(""); setValidTo(""); setMessage(""); setScheduledAt("");
      setReceiptFile(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to submit campaign request"),
  });

  const toggleService = (id: string) =>
    setSelectedServiceIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const canSubmit = !submitting && !!campaignName && !!message && recipientCount > 0;

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
        <div>
          <h2 className="font-display text-lg font-semibold">SMS Campaigns</h2>
          {perSmsPriceCents > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Rate: <span className="font-semibold text-foreground">Rs. {(perSmsPriceCents / 100).toFixed(2)}</span> per SMS
            </p>
          )}
        </div>
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
                <Label>SMS Message</Label>
                <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message auto-fills from offer details above…" />
                <p className="text-xs text-muted-foreground mt-1">{message.length}/160 characters</p>
              </div>

              <div>
                <Label>Schedule Send (optional)</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Leave blank to send immediately after approval</p>
              </div>

              {perSmsPriceCents > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-amber-800">Payment Required</p>
                    <div className="text-right">
                      <p className="text-xs text-amber-700">
                        {recipientCount} SMS × Rs. {(perSmsPriceCents / 100).toFixed(2)}
                      </p>
                      <p className="text-sm font-bold text-amber-900">
                        Total: Rs. {(totalPriceCents / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-700">Please make the payment and upload your receipt below.</p>
                  <input
                    ref={receiptInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                  />
                  <Button type="button" variant="outline" size="sm" className="gap-2 w-full"
                    onClick={() => receiptInputRef.current?.click()}>
                    {receiptFile
                      ? <><FileText className="h-4 w-4 text-green-600" /><span className="truncate max-w-[200px]">{receiptFile.name}</span></>
                      : <><Upload className="h-4 w-4" /> Upload Receipt</>}
                  </Button>
                </div>
              )}

              <Button className="w-full" disabled={!canSubmit || (perSmsPriceCents > 0 && !receiptFile)} onClick={() => doSubmit()}>
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</>
                  : <>Submit Request{perSmsPriceCents > 0 && recipientCount > 0 ? ` · Rs. ${(totalPriceCents / 100).toFixed(2)}` : ""}</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Request submitted dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Request Submitted
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Your campaign request has been submitted and is awaiting admin approval. Once approved, your promo code and booking link will appear in the campaign history below.
            </p>
            <Button className="w-full" onClick={() => setSuccessOpen(false)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Total Fee</TableHead>
              <TableHead>Code / Used</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaignHistory.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  No campaigns yet. Create your first SMS campaign above.
                </TableCell>
              </TableRow>
            )}
            {campaignHistory.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.campaignName}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                  {row.adminNote && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-[160px] truncate" title={row.adminNote}>{row.adminNote}</p>
                  )}
                </TableCell>
                <TableCell>{row.discountPct}%</TableCell>
                <TableCell>{row.recipientCount}</TableCell>
                <TableCell className="text-sm">Rs. {(row.priceCents / 100).toFixed(2)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {row.promoCode
                    ? <span>{row.promoCode.code} · {row.promoCode.usageCount} used</span>
                    : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.validTo ? new Date(row.validTo).toLocaleDateString() : "No expiry"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(row.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default PromotionSMS;
