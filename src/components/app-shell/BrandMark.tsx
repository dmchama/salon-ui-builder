/** SaloonBooking logo for the dark sidebar — same mark and colours as the website navbar, without animation. */
const BrandMark = ({ caption }: { caption: string }) => (
  <div className="flex items-center gap-3 min-w-0">
    <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/25 to-transparent" />
      <svg viewBox="0 0 20 20" fill="none" className="relative h-5 w-5" aria-hidden="true">
        <circle cx="4.5" cy="5.5" r="2.6" stroke="white" strokeWidth="1.55" fill="rgba(255,255,255,0.2)" />
        <circle cx="4.5" cy="14.5" r="2.6" stroke="white" strokeWidth="1.55" fill="rgba(255,255,255,0.2)" />
        <path d="M6.9 7.1L18 3.4" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M6.9 12.9L18 16.6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M10.8 10L6.9 7.1" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M10.8 10L6.9 12.9" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
    <div className="flex min-w-0 flex-col leading-none gap-1">
      <span className="font-display text-base font-black tracking-tight text-white">
        Saloon<span className="text-gradient-gold">Booking</span>
      </span>
      <span className="text-[11px] font-medium text-white/50">{caption}</span>
    </div>
  </div>
);

export default BrandMark;
