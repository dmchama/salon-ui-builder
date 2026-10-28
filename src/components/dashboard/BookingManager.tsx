import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, Panel, SectionSkeleton, StatusBadge } from "@/components/app-shell/parts";
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
import { CalendarCheck, CheckCircle, XCircle, Clock, Eye, Store } from "lucide-react";
import { toast } from "sonner";
import {
  fetchSalonBookings,
  updateBookingStatus,
  type SalonBookingRow,
} from "@/api/bookings-api";
import { ApiError } from "@/api/http";


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

type FilterValue = "all" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

type Props = { salonId: string | null };

const BookingManager = ({ salonId }: Props) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [selectedBooking, setSelectedBooking] = useState<SalonBookingRow | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["salon-bookings", salonId],
    queryFn: () => fetchSalonBookings(salonId!),
    enabled: Boolean(salonId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["salon-bookings", salonId] });
    queryClient.invalidateQueries({ queryKey: ["owner-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["owner-insights"] });
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

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  if (!salonId) {
    return (
      <Panel>
        <EmptyState icon={Store} title="No branch selected" description="Choose a branch at the top to see its bookings." />
      </Panel>
    );
  }

  if (isLoading) return <SectionSkeleton />;

  const rowActions = (booking: SalonBookingRow) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedBooking(booking)} aria-label="View details" title="View details">
        <Eye className="h-4 w-4" />
      </Button>
      {booking.status === "CONFIRMED" && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
            onClick={() => statusMutation.mutate({ id: booking.id, status: "COMPLETED" })}
            aria-label="Mark complete"
            title="Mark complete"
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-red-50"
            onClick={() => setBookingToCancel(booking.id)}
            aria-label="Cancel booking"
            title="Cancel booking"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );

  const when = (b: SalonBookingRow) =>
    new Date(b.startAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-4">
      <Panel
        title={`${filtered.length} ${filtered.length === 1 ? "booking" : "bookings"}`}
        actions={
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
            <SelectTrigger className="h-9 w-44 rounded-lg" aria-label="Filter by status">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="NO_SHOW">No show</SelectItem>
            </SelectContent>
          </Select>
        }
        bodyClassName="p-0"
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={filter === "all" ? "No bookings yet" : "No bookings with this status"}
            description={filter === "all" ? "Bookings appear here as soon as guests book online." : "Try another filter."}
          />
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Guest</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="pl-5">
                        <div className="font-medium">{displayCustomerName(booking)}</div>
                        <div className="text-xs text-muted-foreground">{displayPhone(booking)}</div>
                      </TableCell>
                      <TableCell>
                        <div>{booking.service.name}</div>
                        {booking.technician && <div className="text-xs text-muted-foreground">with {booking.technician.name}</div>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{when(booking)}</TableCell>
                      <TableCell>
                        <StatusBadge kind="booking" status={booking.status} />
                      </TableCell>
                      <TableCell className="pr-5">{rowActions(booking)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Phone: stacked list */}
            <ul className="divide-y divide-border/70 md:hidden">
              {filtered.map((booking) => (
                <li key={booking.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{displayCustomerName(booking)}</span>
                      <StatusBadge kind="booking" status={booking.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{booking.service.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {when(booking)}
                    </p>
                  </div>
                  {rowActions(booking)}
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <Dialog
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Booking details</DialogTitle>
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
                  <p className="mt-0.5">
                    <StatusBadge kind="booking" status={selectedBooking.status} />
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


      <AlertDialog open={!!bookingToCancel} onOpenChange={(open) => !open && setBookingToCancel(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              The guest will be notified when your API sends notifications for status changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
