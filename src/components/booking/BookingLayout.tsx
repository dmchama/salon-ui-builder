import { Fragment, type ReactNode } from "react";
import { ArrowLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStep = { key: string; label: string };

type Props = {
  steps: WizardStep[];
  currentKey: string;
  /** Past steps are clickable (AC15). */
  onStepClick: (key: string) => void;
  onBack: () => void;
  onClose: () => void;
  title: string;
  summary: ReactNode;
  children: ReactNode;
};

/** Full-screen booking wizard shell: header, breadcrumb, title, content + summary column. */
const BookingLayout = ({ steps, currentKey, onStepClick, onBack, onClose, title, summary, children }: Props) => {
  const currentIndex = steps.findIndex((s) => s.key === currentKey);

  return (
    <div className="min-h-screen bg-gray-50/80 pb-28 lg:pb-16">
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking"
            className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-10 xl:gap-16 mt-6">
          <div className="min-w-0 lg:pl-8">
            <nav aria-label="Booking steps" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {steps.map((step, i) => {
                const isPast = i < currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <Fragment key={step.key}>
                    {i > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                    {isPast ? (
                      <button
                        type="button"
                        onClick={() => onStepClick(step.key)}
                        className="text-gray-600 hover:text-gray-900 hover:underline"
                      >
                        {step.label}
                      </button>
                    ) : (
                      <span
                        aria-current={isCurrent ? "step" : undefined}
                        className={cn(isCurrent ? "font-semibold text-gray-900" : "text-gray-400")}
                      >
                        {step.label}
                      </span>
                    )}
                  </Fragment>
                );
              })}
            </nav>

            <h1 className="font-display text-3xl md:text-[2.75rem] md:leading-tight font-bold tracking-tight text-gray-900 mt-4 mb-8">
              {title}
            </h1>

            {children}
          </div>

          <aside className="lg:pt-10">{summary}</aside>
        </div>
      </div>
    </div>
  );
};

export default BookingLayout;
