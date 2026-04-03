import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface Booking {
  id: string;
  customer: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  notes: string;
}

const initialBookings: Booking[] = [
  { id: "b1", customer: "Ama Perera", phone: "+94 77 123 4567", service: "Haircut & Styling", date: "2026-03-25", time: "10:00 AM", status: "confirmed", notes: "" },
  { id: "b2", customer: "Kamal Silva", phone: "+94 71 234 5678", service: "Hair Coloring", date: "2026-03-25", time: "2:00 PM", status: "pending", notes: "First time customer" },
  { id: "b3", customer: "Nisha Fernando", phone: "+94 76 345 6789", service: "Keratin Treatment", date: "2026-03-26", time: "11:00 AM", status: "confirmed", notes: "" },
  { id: "b4", customer: "Ravi Kumar", phone: "+94 70 456 7890", service: "Bridal Package", date: "2026-03-27", time: "9:00 AM", status: "pending", notes: "Wedding on April 5th" },
  { id: "b5", customer: "Dilani Jayawardena", phone: "+94 77 567 8901", service: "Facial Treatment", date: "2026-03-24", time: "3:00 PM", status: "completed", notes: "" },
  { id: "b6", customer: "Suresh Bandara", phone: "+94 71 678 9012", service: "Haircut & Styling", date: "2026-03-23", time: "4:00 PM", status: "cancelled", notes: "Customer no-show" },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-green-600 hover:bg-green-700 text-white border-0",
  pending: "bg-yellow-500 hover:bg-yellow-600 text-white border-0",
  cancelled: "bg-red-500 hover:bg-red-600 text-white border-0",
  completed: "bg-slate-500 hover:bg-slate-600 text-white border-0",
};

const BookingManager = () => {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [filter, setFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const updateStatus = (id: string, status: Booking["status"]) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (status === "cancelled") setBookingToCancel(null);
    toast.success(`Booking ${status}`);
  };

  const handleReschedule = () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) return;
    setBookings(prev => prev.map(b =>
      b.id === selectedBooking.id ? { ...b, date: rescheduleDate, time: rescheduleTime } : b
    ));
    setRescheduleOpen(false);
    setSelectedBooking(null);
    toast.success("Booking rescheduled!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{filtered.length} bookings</span>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bookings</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map(booking => (
          <Card key={booking.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{booking.customer}</h3>
                    <Badge className={`${statusColors[booking.status]} capitalize`}>{booking.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{booking.service}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {booking.date} at {booking.time}
                  </p>
                  {booking.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">"{booking.notes}"</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedBooking(booking)} title="View details">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {booking.status === "pending" && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => updateStatus(booking.id, "confirmed")} title="Confirm">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setBookingToCancel(booking.id)} title="Cancel">
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedBooking(booking); setRescheduleDate(booking.date); setRescheduleTime(booking.time); setRescheduleOpen(true); }} title="Reschedule">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => updateStatus(booking.id, "completed")} title="Mark complete">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setBookingToCancel(booking.id)} title="Cancel">
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No bookings found</div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedBooking && !rescheduleOpen} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Customer:</span><p className="font-medium">{selectedBooking.customer}</p></div>
                <div><span className="text-muted-foreground">Phone:</span><p className="font-medium">{selectedBooking.phone}</p></div>
                <div><span className="text-muted-foreground">Service:</span><p className="font-medium">{selectedBooking.service}</p></div>
                <div><span className="text-muted-foreground">Status:</span><p><Badge className={`${statusColors[selectedBooking.status]} capitalize`}>{selectedBooking.status}</Badge></p></div>
                <div><span className="text-muted-foreground">Date:</span><p className="font-medium">{selectedBooking.date}</p></div>
                <div><span className="text-muted-foreground">Time:</span><p className="font-medium">{selectedBooking.time}</p></div>
              </div>
              {selectedBooking.notes && (
                <div className="text-sm"><span className="text-muted-foreground">Notes:</span><p className="italic mt-1">{selectedBooking.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Reschedule Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rescheduling for <span className="font-medium text-foreground">{selectedBooking?.customer}</span> — {selectedBooking?.service}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Date</Label>
                <Input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>New Time</Label>
                <Input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
              <Button onClick={handleReschedule}>Confirm Reschedule</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!bookingToCancel} onOpenChange={(open) => !open && setBookingToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will cancel the booking and notify the customer. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction onClick={() => bookingToCancel && updateStatus(bookingToCancel, "cancelled")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookingManager;
