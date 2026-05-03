import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, ExternalLink, Loader2, Save, Receipt } from "lucide-react";
import { toast } from "sonner";
import {
  fetchSmsCampaignPrice,
  saveSmsCampaignPrice,
  fetchAdminCampaignRequests,
  approveAdminCampaignRequest,
  rejectAdminCampaignRequest,
  type AdminCampaignRequestDto,
} from "@/api/admin-api";

function StatusBadge({ status }: { status: AdminCampaignRequestDto["status"] }) {
  if (status === "APPROVED") return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
  return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
}

const CampaignRequestManager = () => {
  const qc = useQueryClient();
  const [priceInput, setPriceInput] = useState("");
  const [priceLoaded, setPriceLoaded] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<AdminCampaignRequestDto | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [detailTarget, setDetailTarget] = useState<AdminCampaignRequestDto | null>(null);

  const { data: priceData, isLoading: priceLoading } = useQuery<{ priceCents: number }>({
    queryKey: ["adminSmsCampaignPrice"],
    queryFn: fetchSmsCampaignPrice,
  });

  useEffect(() => {
    if (priceData && !priceLoaded) {
      setPriceInput(String(priceData.priceCents / 100));
      setPriceLoaded(true);
    }
  }, [priceData, priceLoaded]);

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["adminCampaignRequests"],
    queryFn: fetchAdminCampaignRequests,
  });

  const { mutate: savePriceMut, isPending: savingPrice } = useMutation({
    mutationFn: () => saveSmsCampaignPrice(Math.round(parseFloat(priceInput) * 100) || 0),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["adminSmsCampaignPrice"] });
      toast.success(`Price set to Rs. ${(d.priceCents / 100).toFixed(2)}`);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save price"),
  });

  const { mutate: doApprove, isPending: approving } = useMutation({
    mutationFn: (id: string) => approveAdminCampaignRequest(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["adminCampaignRequests"] });
      toast.success(`Campaign approved — promo code: ${res.promoCode}`);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to approve"),
  });

  const { mutate: doReject, isPending: rejecting } = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => rejectAdminCampaignRequest(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminCampaignRequests"] });
      setRejectTarget(null);
      setRejectNote("");
      toast.success("Campaign request rejected");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to reject"),
  });

  const currentPriceCents = priceData?.priceCents ?? 0;

  return (
    <div className="space-y-6">
      {/* Price Setting */}
      <Card className="p-4">
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <Label className="text-sm font-semibold">SMS Campaign Fee</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Set the price salon admins must pay to run an SMS campaign.
              {currentPriceCents > 0 && <span className="ml-1 font-medium text-foreground">Current: Rs. {(currentPriceCents / 100).toFixed(2)}</span>}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rs.</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={priceLoaded ? priceInput : priceLoading ? "…" : ""}
                onChange={(e) => setPriceInput(e.target.value)}
                className="max-w-[120px]"
                disabled={priceLoading}
              />
            </div>
          </div>
          <Button size="sm" className="gap-1.5 mb-0.5" onClick={() => savePriceMut()} disabled={savingPrice || priceLoading}>
            {savingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Price
          </Button>
        </div>
      </Card>

      {/* Requests Table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Campaign Requests</h3>
        {requestsLoading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Salon / Owner</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                      No campaign requests yet.
                    </TableCell>
                  </TableRow>
                )}
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium max-w-[140px]">
                      <button className="text-left hover:underline" onClick={() => setDetailTarget(req)}>
                        {req.campaignName}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{req.salon.name}</div>
                      <div className="text-muted-foreground text-xs">{req.owner.displayName}</div>
                    </TableCell>
                    <TableCell>{req.discountPct}%</TableCell>
                    <TableCell>{req.recipientCount}</TableCell>
                    <TableCell className="text-sm">Rs. {(req.priceCents / 100).toFixed(0)}</TableCell>
                    <TableCell>
                      {req.receiptUrl
                        ? <a href={req.receiptUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Receipt className="h-3 w-3" />View</a>
                        : <span className="text-xs text-muted-foreground">None</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={req.status} />
                      {req.promoCode && (
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">{req.promoCode.code}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {req.status === "PENDING" && (
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="default" className="h-7 px-2 text-xs gap-1"
                            disabled={approving}
                            onClick={() => doApprove(req.id)}>
                            {approving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => { setRejectTarget(req); setRejectNote(""); }}>
                            <XCircle className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      )}
                      {req.adminNote && req.status === "REJECTED" && (
                        <p className="text-xs text-muted-foreground max-w-[120px] truncate" title={req.adminNote}>{req.adminNote}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) setRejectTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Campaign Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Rejecting <strong>{rejectTarget?.campaignName}</strong> by {rejectTarget?.owner.displayName}.
            </p>
            <div>
              <Label className="text-xs">Reason (optional)</Label>
              <Textarea rows={3} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Explain why the request is rejected…" />
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1" disabled={rejecting}
                onClick={() => rejectTarget && doReject({ id: rejectTarget.id, note: rejectNote })}>
                {rejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Reject
              </Button>
              <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailTarget} onOpenChange={(o) => { if (!o) setDetailTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detailTarget?.campaignName}</DialogTitle>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-3 pt-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Salon:</span> <span className="font-medium">{detailTarget.salon.name}</span></div>
                <div><span className="text-muted-foreground">Owner:</span> <span className="font-medium">{detailTarget.owner.displayName}</span></div>
                <div><span className="text-muted-foreground">Segment:</span> <span className="font-medium">{detailTarget.segment}</span></div>
                <div><span className="text-muted-foreground">Discount:</span> <span className="font-medium">{detailTarget.discountPct}% {detailTarget.discountScope.replace(/_/g, " ")}</span></div>
                <div><span className="text-muted-foreground">Recipients:</span> <span className="font-medium">{detailTarget.recipientCount}</span></div>
                <div><span className="text-muted-foreground">Fee:</span> <span className="font-medium">Rs. {(detailTarget.priceCents / 100).toFixed(2)}</span></div>
                {detailTarget.validFrom && <div><span className="text-muted-foreground">From:</span> <span className="font-medium">{new Date(detailTarget.validFrom).toLocaleDateString()}</span></div>}
                {detailTarget.validTo && <div><span className="text-muted-foreground">To:</span> <span className="font-medium">{new Date(detailTarget.validTo).toLocaleDateString()}</span></div>}
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">SMS Message:</p>
                <p className="bg-muted/40 rounded p-2 text-xs">{detailTarget.message}</p>
              </div>
              {detailTarget.receiptUrl && (
                <a href={detailTarget.receiptUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-600 hover:underline text-xs">
                  <ExternalLink className="h-3.5 w-3.5" /> View Payment Receipt
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignRequestManager;
