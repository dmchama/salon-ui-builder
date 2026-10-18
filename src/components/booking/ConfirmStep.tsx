import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { validateEmail, validateName, validatePhone } from "@/lib/booking-format";

const inputClass = "rounded-xl border-gray-200 bg-white h-12 px-4 text-gray-900 placeholder:text-gray-400";
const inputErrorClass = "rounded-xl border-red-300 bg-red-50 h-12 px-4 text-gray-900 placeholder:text-gray-400";

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-sm font-medium text-gray-700 block">
    {children} <span className="text-red-500">*</span>
  </label>
);

export type ContactValues = { name: string; phone: string; email: string };

type Props = {
  values: ContactValues;
  onChange: (values: ContactValues) => void;
  touched: Record<keyof ContactValues, boolean>;
  onBlur: (field: keyof ContactValues) => void;
  showAllErrors: boolean;
  paymentOption: string;
  onPaymentChange: (option: string) => void;
  error?: string | null;
};

const ConfirmStep = ({ values, onChange, touched, onBlur, showAllErrors, paymentOption, onPaymentChange, error }: Props) => {
  const show = (f: keyof ContactValues) => touched[f] || showAllErrors;
  const nameError = show("name") && !validateName(values.name) ? "Please enter your full name" : null;
  const phoneError =
    show("phone") && !validatePhone(values.phone) ? "Enter a valid phone number (e.g. +94 77 123 4567)" : null;
  const emailError = show("email") && !validateEmail(values.email) ? "Enter a valid email address" : null;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Your details</h2>
        <p className="text-sm text-gray-500 -mt-2">No account required.</p>
        <div className="space-y-1.5">
          <RequiredLabel>Full name</RequiredLabel>
          <Input
            value={values.name}
            onChange={(e) => onChange({ ...values, name: e.target.value })}
            onBlur={() => onBlur("name")}
            placeholder="Jane Doe"
            autoComplete="name"
            className={nameError ? inputErrorClass : inputClass}
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <RequiredLabel>Phone</RequiredLabel>
            <Input
              type="tel"
              value={values.phone}
              onChange={(e) => onChange({ ...values, phone: e.target.value })}
              onBlur={() => onBlur("phone")}
              placeholder="+94 77 123 4567"
              autoComplete="tel"
              className={phoneError ? inputErrorClass : inputClass}
            />
            {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
          </div>
          <div className="space-y-1.5">
            <RequiredLabel>Email</RequiredLabel>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => onChange({ ...values, email: e.target.value })}
              onBlur={() => onBlur("email")}
              placeholder="you@example.com"
              autoComplete="email"
              className={emailError ? inputErrorClass : inputClass}
            />
            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: "pay-at-salon", title: "Pay at salon", detail: "Settle after your service." },
            { id: "pay-now", title: "Pay online", detail: "Integration can be added later." },
          ].map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onPaymentChange(o.id)}
              className={cn(
                "p-5 rounded-xl border bg-white text-left transition-colors",
                paymentOption === o.id ? "border-gold ring-2 ring-gold" : "border-gray-200 hover:border-gray-400",
              )}
            >
              <span className="block font-semibold text-gray-900">{o.title}</span>
              <span className="block text-sm text-gray-500">{o.detail}</span>
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
    </div>
  );
};

export default ConfirmStep;
