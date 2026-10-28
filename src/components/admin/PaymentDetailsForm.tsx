import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Landmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/api/http";
import { savePaymentDetails, type PaymentDetails, type PaymentDetailsInput } from "@/api/admin-api";

const schema = z.object({
  bankName: z.string().trim().min(1, "Required").max(100),
  accountName: z.string().trim().min(1, "Required").max(100),
  accountNumber: z.string().trim().min(1, "Required").max(40),
  branch: z.string().trim().max(100),
  instructions: z.string().trim().max(500),
});
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = { bankName: "", accountName: "", accountNumber: "", branch: "", instructions: "" };

/** Bank details shown on the registration payment step (spec 002 AC20). */
const PaymentDetailsForm = ({ current }: { current: PaymentDetails | null }) => {
  const qc = useQueryClient();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: current ?? EMPTY });
  const { errors } = form.formState;

  useEffect(() => {
    form.reset(current ?? EMPTY);
  }, [current, form]);

  const save = useMutation({
    mutationFn: (values: FormValues) => savePaymentDetails(values as PaymentDetailsInput),
    onSuccess: () => {
      toast.success("Payment details saved");
      qc.invalidateQueries({ queryKey: ["admin-website"] });
      qc.invalidateQueries({ queryKey: ["website-settings-public"] });
    },
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : "Could not save payment details"),
  });

  const field = (name: keyof FormValues, label: string, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`pd-${name}`}>{label}</Label>
      <Input id={`pd-${name}`} placeholder={placeholder} {...form.register(name)} />
      {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Landmark className="h-4 w-4" /> Payment details (registration)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Shown to new salon owners on the payment step. Owners pay to this account and upload the receipt.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4 max-w-xl" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("bankName", "Bank name", "Commercial Bank PLC")}
            {field("branch", "Branch", "Colombo 03")}
            {field("accountName", "Account name", "SaloonBooking (Pvt) Ltd")}
            {field("accountNumber", "Account number", "1234 5678 9012")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pd-instructions">Instructions</Label>
            <Textarea
              id="pd-instructions"
              rows={2}
              placeholder="Use your email address as the payment reference."
              {...form.register("instructions")}
            />
            {errors.instructions && <p className="text-xs text-destructive">{errors.instructions.message}</p>}
          </div>
          <Button type="submit" disabled={save.isPending} className="gap-2">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save payment details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentDetailsForm;
