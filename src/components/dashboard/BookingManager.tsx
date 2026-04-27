import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarCheck, CheckCircle, XCircle, Clock, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  fetchSalonBookings,
  rescheduleBooking,
  updateBookingStatus,
  type SalonBookingRow,
} from "@/api/bookings-api";
import { ApiError } from "@/api/http";

function combineLocalDateAndTime(dateStr: string, timeStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, (mo ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
}

function titleCaseStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayCustomerName(b: SalonBookingRow) {
  if (b.guestName?.trim()) return b.guestName.trim();
  const c = b.customer;
  if (c?.firstName || c?.lastName) {
    return [c.firstName, c.lastName].filter(Boolean).join(" ");
  }
  return "Guest";
}

function displayPhone(b: SalonBookingRow) {
  return b.guestPhone?.trim() || b.customer?.phone || "—";
}

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-green-600 hover:bg-green-700 text-white border-0",
  PENDING: "bg-yellow-500 hover:bg-yellow-600 text-white border-0",
  CANCELLED: "bg-red-500 hover:bg-red-600 text-white border-0",
  COMPLETED: "bg-slate-500 hover:bg-slate-600 text-white border-0",
  NO_SHOW: "bg-orange-600 hover:bg-orange-700 text-white border-0",
};

type FilterValue = "all" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

type Props = { salonId: string | null };

const BookingManager = ({ salonId }: Props) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [selectedBooking, setSelectedBooking] = useState<SalonBookingRow | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["salon-bookings", salonId],
    queryFn: () => fetchSalonBookings(salonId!),
    enabled: Boolean(salonId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["salon-bookings", salonId] });
    queryClient.invalidateQueries({ queryKey: ["owner-dashboard"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBookingStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast.success("Booking updated");
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Update failed";
      toast.error(msg);
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, startAt }: { id: string; startAt: string }) => rescheduleBooking(id, startAt),
    onSuccess: () => {
      invalidate();
      setRescheduleOpen(false);
      setSelectedBooking(null);
      toast.success("Booking rescheduled");
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Could not reschedule";
      toast.error(msg);
    },
  });

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const openReschedule = (b: SalonBookingRow) => {
    const start = new Date(b.startAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    setRescheduleDate(
      `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    );
    setRescheduleTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`);
    setSelectedBooking(b);
    setRescheduleOpen(true);
  };

  const handleReschedule = () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) return;
    const start = combineLocalDateAndTime(rescheduleDate, rescheduleTime);
    if (start <= new Date()) {
      toast.error("Choose a future date and time.");
      return;
    }
    rescheduleMutation.mutate({
      id: selectedBooking.id,
      startAt: start.toISOString(),
    });
  };

  const todayMin = new Date().toISOString().slice(0, 10);

  if (!salonId) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12 tracking-wide">
        Select a salon above to load bookings.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Loading bookings…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{filtered.length} bookings</span>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
          <SelectTrigger className="w-44 h-8 text-sm rounded-none">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="NO_SHOW">No show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((booking) => {
          const start = new Date(booking.startAt);
          const dateStr = start.toLocaleDateString();
          const timeStr = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
          const badgeClass =
            statusColors[booking.status] ?? "bg-secondary text-secondary-foreground border-0";

          return (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-sm">{displayCustomerName(booking)}</h3>
                      <Badge className={`${badgeClass} capitalize`}>{titleCaseStatus(booking.status)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{booking.service.name}</p>
                    {booking.technician && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Technician:{" "}
                        <span className="text-foreground font-medium">{booking.technician.name}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {dateStr} · {timeStr}
                    </p>
                    {booking.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">&quot;{booking.notes}&quot;</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedBooking(booking)}
                      title="View details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {booking.status === "PENDING" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600"
                          onClick={() => statusMutation.mutate({ id: booking.id, status: "CONFIRMED" })}
                          title="Confirm"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setBookingToCancel(booking.id)}
                          title="Cancel"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {booking.status === "CONFIRMED" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openReschedule(booking)}
                          title="Reschedule"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600"
                          onClick={() => statusMutation.mutate({ id: booking.id, status: "COMPLETED" })}
                          title="Mark complete"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setBookingToCancel(booking.id)}
                          title="Cancel"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No bookings found</div>
        )}
      </div>

      <Dialog
        open={!!selectedBooking && !rescheduleOpen}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-display">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer</span>
                  <p className="font-medium">{displayCustomerName(selectedBooking)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="font-medium">{displayPhone(selectedBooking)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{selectedBooking.guestEmail || selectedBooking.customer?.email || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Service</span>
                  <p className="font-medium">{selectedBooking.service.name}</p>
                </div>
                {selectedBooking.technician && (
                  <div>
                    <span className="text-muted-foreground">Technician</span>
                    <p className="font-medium">{selectedBooking.technician.name}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p>
                    <Badge
                      className={
                        statusColors[selectedBooking.status] ??
                        "bg-secondary text-secondary-foreground border-0"
                      }
                    >
                      {titleCaseStatus(selectedBooking.status)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Starts</span>
                  <p className="font-medium">
                    {new Date(selectedBooking.startAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
              {selectedBooking.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes</span>
                  <p className="italic mt-1">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-display">Reschedule Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rescheduling for{" "}
              <span className="font-medium text-foreground">
                {selectedBooking ? displayCustomerName(selectedBooking) : ""}
              </span>{" "}
              — {selectedBooking?.service.name}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New date</Label>
                <Input
                  type="date"
                  min={todayMin}
                  className="rounded-none"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>New time</Label>
                <Input
                  type="time"
                  className="rounded-none"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-none" onClick={() => setRescheduleOpen(false)}>
                Cancel
              </Button>
              <Button
                className="rounded-none"
                onClick={handleReschedule}
                disabled={rescheduleMutation.isPending}
              >
                Confirm reschedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!bookingToCancel} onOpenChange={(open) => !open && setBookingToCancel(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              The guest will be notified when your API sends notifications for status changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Keep booking</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (bookingToCancel) {
                  statusMutation.mutate({ id: bookingToCancel, status: "CANCELLED" });
                  setBookingToCancel(null);
                }
              }}
            >
              Cancel booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookingManager;
