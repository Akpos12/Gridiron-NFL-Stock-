import React, { useState } from "react";
import {
  Headphones,
  Mail,
  Search,
  Download,
  ShieldCheck,
  ChevronDown,
  FileText,
  RefreshCw,
  Clock,
  HelpCircle,
  MessageSquareText,
  ArrowRight,
  Building2,
  CheckCircle2
} from "lucide-react";
import { cn } from "../lib/utils";

interface FAQItem {
  q: string;
  a: string;
}

const SUPPORT_FAQS: FAQItem[] = [
  {
    q: "How do I know if an experience has confirmed dates vs. special player coordination?",
    a: "Every listing clearly states its schedule status upfront. Stadium Tours, VMAC Training Camp sessions, Match Tickets, and Arena Shop inventory display confirmed dates or ready dispatch. 1-on-1 Private Player Experiences and Podcast Sessions show 'By Player Availability' or 'Special Arrangement' and are scheduled directly with you upon approval."
  },
  {
    q: "Where does the $100 fee go when I use 'Inquire About A Player'?",
    a: "100% of the $100 Player Inquiry fee goes directly to charitable organizations supported by our athlete outreach network. Once submitted, our liaison team reaches out on your selected messaging channel (WhatsApp, Zangi, or Telegram) with verified player availability."
  },
  {
    q: "How do I track an order, inquiry, or download my approved pass?",
    a: "Use the 'Track Inquiry' button with your reference code (e.g. TRK-XXXXXXX) or email address to view live Customer Care replies. Approved stadium passes and match tickets are ready for immediate QR & PDF download inside the 'Check / Download Pass' portal."
  },
  {
    q: "What is your refund and cancellation policy?",
    a: "For unconfirmed Special Arrangement / Private Player requests where talent scheduling cannot be aligned within your travel window, you may request a cancellation or credit reassignment prior to final schedule lock. Signed Vault memorabilia is backed by third-party hologram authentication guarantees."
  },
  {
    q: "How is signed merchandise authenticated?",
    a: "Flagship autographed jerseys, helmets, and official Wilson footballs carry serialized tamper-evident holograms and Certificates of Authenticity (Beckett Witnessed or official team vendor documentation)."
  }
];

interface SupportTrustSectionProps {
  onOpenCustomerCare: () => void;
  onOpenTrackInquiry: () => void;
  onOpenTicketCheck: () => void;
  compact?: boolean;
}

export const SupportTrustSection: React.FC<SupportTrustSectionProps> = ({
  onOpenCustomerCare,
  onOpenTrackInquiry,
  onOpenTicketCheck,
  compact = false
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className={cn("max-w-7xl mx-auto space-y-12", compact ? "" : "p-4 sm:p-6 md:p-10 pb-28")}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-[#080f2b] via-[#070a18] to-[#120826] border border-indigo-500/25 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-widest">
              <Headphones className="w-3.5 h-3.5" />
              Customer Support &amp; Fan Concierge
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold italic uppercase tracking-tight text-white leading-[0.95]">
              DEDICATED SUPPORT.{" "}
              <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
                TRANSPARENT POLICIES.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              Need booking assistance, order tracking, pass downloads, or refund clarification? Our concierge team and self-service verification tools are available 24/7.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenCustomerCare}
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
            >
              <MessageSquareText className="w-4 h-4" />
              Contact Customer Care
            </button>
            <button
              type="button"
              onClick={onOpenTrackInquiry}
              className="px-6 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
            >
              <Search className="w-4 h-4 text-sky-400" />
              Track Order / Inquiry
            </button>
          </div>
        </div>
      </div>

      {/* Quick Help Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-[#080c1c] border border-white/10 space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-sky-400">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Direct Contact Channels</h3>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Reach our Fan Concierge Desk directly at <span className="font-mono text-sky-300">concierge@nflgridiron.company</span> or open a tracked priority ticket with under 5-minute response monitoring.
          </p>
          <button
            type="button"
            onClick={onOpenCustomerCare}
            className="text-xs font-bold text-sky-400 hover:text-white inline-flex items-center gap-1.5 pt-1 cursor-pointer"
          >
            Start Live Support Ticket <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-[#080c1c] border border-white/10 space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Download className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Booking &amp; Pass Retrieval</h3>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Verify any booking reference ID or guest email to download approved PDF passes, QR stadium credentials, and itinerary updates instantly.
          </p>
          <button
            type="button"
            onClick={onOpenTicketCheck}
            className="text-xs font-bold text-emerald-400 hover:text-white inline-flex items-center gap-1.5 pt-1 cursor-pointer"
          >
            Open Ticket &amp; Pass Portal <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-[#080c1c] border border-white/10 space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Refund &amp; Cancellation Policy</h3>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Unscheduled special-arrangement bookings may be cancelled for full review before talent dates lock. Verified COA merchandise ships insured with authenticity protection.
          </p>
          <button
            type="button"
            onClick={onOpenTrackInquiry}
            className="text-xs font-bold text-purple-300 hover:text-white inline-flex items-center gap-1.5 pt-1 cursor-pointer"
          >
            Check Refund / Order Status <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* FAQs & Business Identity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Interactive FAQ Accordion */}
        <div className="lg:col-span-7 bg-[#080c1c] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
            <HelpCircle className="w-5 h-5 text-sky-400" />
            <h3 className="font-display text-2xl font-extrabold uppercase italic text-white">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {SUPPORT_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-2xl border transition-colors overflow-hidden",
                    isOpen ? "bg-zinc-950/90 border-indigo-500/40" : "bg-zinc-950/50 border-white/5"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer min-h-[48px]"
                  >
                    <span className="text-sm font-bold text-white leading-snug">{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-sky-400 shrink-0 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Business Identity, Terms & Booking Protections */}
        <div className="lg:col-span-5 bg-[#080c1c] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <Building2 className="w-5 h-5 text-purple-400" />
              <h3 className="font-display text-2xl font-extrabold uppercase italic text-white">
                Business Identity &amp; Terms
              </h3>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-zinc-950/75 border border-white/5 space-y-1.5">
                <p className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  NFL Gridiron Company (nflgridiron.company)
                </p>
                <p className="text-xs text-zinc-400">
                  Independent NFL fan experience concierge, verified memorabilia marketplace, and hospitality coordination platform serving supporters across all 32 franchises.
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" /> Key Booking &amp; Purchase Terms
                </h4>
                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Payment receipts submitted at checkout undergo manual verification prior to final digital pass dispatch.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>All $100 direct player availability inquiry fees are earmarked 100% for charitable donation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Stadium credentials require valid government photo ID matching the registered guest name at venue entry.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-indigo-500/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs font-semibold text-zinc-200">24/7 Support Desk · Under 5m Triage</span>
            </div>
            <button
              type="button"
              onClick={onOpenCustomerCare}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-wider shrink-0 cursor-pointer"
            >
              Ask Concierge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
