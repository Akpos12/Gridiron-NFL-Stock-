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
import { CHARITY_ALLOCATION } from "./common/GridironBrandMark";
import type { LegalTabId } from "./LegalPoliciesModal";

interface FAQItem {
  q: string;
  a: string;
}

const SUPPORT_FAQS: FAQItem[] = [
  {
    q: "How does the $100 Meet & Greet Invitation request work?",
    a: "When you submit a request using 'GET YOUR INVITATION – $100', our team places your chosen favorite player in our hospitality scheduling queue. Invitations are subject to player availability, confirmed events, and authorized arrangements, and a direct message is sent to you as soon as the next invitation opportunity opens."
  },
  {
    q: "How is the $100 divided between coordination fees and Boys & Girls Clubs of America?",
    a: `Transparency comes first: $${CHARITY_ALLOCATION.coordinationFeeUsd}.00 of each $100 invitation covers payment processing, hospitality research, and customer messaging operations, while $${CHARITY_ALLOCATION.charitableContributionUsd}.00 is earmarked toward our charitable initiative supporting ${CHARITY_ALLOCATION.beneficiary} youth education and mentorship programs. Gridiron Fan Hospitality LLC does not claim an official partnership or endorsement from BGCA.`
  },
  {
    q: "How do I track an order, inquiry, or download my approved pass?",
    a: "Use the 'Track Order / Inquiry' portal with your reference code (e.g. INQ-XXXX or TRK-XXXX) or email address to view live concierge replies. Approved passes and tickets become available for QR and PDF download once verified."
  },
  {
    q: "What is your refund and cancellation policy?",
    a: "If a meet-and-greet invitation request cannot be scheduled within 60 days of payment verification—or if an administrator declines your request—you may request a full refund to your original payment method. Please allow 5–7 business days for processing."
  },
  {
    q: "How are card payments protected?",
    a: "Card payments use encrypted hosted payment processing (Stripe Checkout). Complete debit or credit card numbers and CVV codes are never entered or stored on www.nflgridiron.company."
  }
];

interface SupportTrustSectionProps {
  onOpenCustomerCare: () => void;
  onOpenTrackInquiry: () => void;
  onOpenTicketCheck: () => void;
  onOpenLegalModal?: (tab: LegalTabId) => void;
  compact?: boolean;
}

export const SupportTrustSection: React.FC<SupportTrustSectionProps> = ({
  onOpenCustomerCare,
  onOpenTrackInquiry,
  onOpenTicketCheck,
  onOpenLegalModal,
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
        <div className="lg:col-span-5 bg-[#050816] border border-[#013369]/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <Building2 className="w-5 h-5 text-sky-400" />
              <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white">
                Business Identity &amp; Policies
              </h3>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-[#03050C] border border-white/10 space-y-1.5">
                <p className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  {CHARITY_ALLOCATION.operatorLegalName} ({CHARITY_ALLOCATION.websiteDomain})
                </p>
                <p className="text-xs text-zinc-400">
                  Sports hospitality, memorabilia, and player meet-and-greet coordination service.
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" /> Verification &amp; Charitable Standards
                </h4>
                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>No inquiry requiring manual proof-of-payment is marked paid until verified by our administration desk.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>Each $100 invitation clearly separates $75 coordination fee from $25 earmarked for {CHARITY_ALLOCATION.beneficiary}.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Card payments use hosted tokenization and never store raw card numbers or CVV codes.</span>
                  </li>
                </ul>
              </div>

              {onOpenLegalModal && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(
                    [
                      { id: "about", label: "About Us" },
                      { id: "contact", label: "Contact" },
                      { id: "charity", label: "Charity Info" },
                      { id: "privacy", label: "Privacy" },
                      { id: "terms", label: "Terms" },
                      { id: "refund", label: "Refund Policy" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onOpenLegalModal(item.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#03050C] hover:bg-[#013369]/60 border border-white/10 text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#03050C] border border-[#013369]/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs font-semibold text-zinc-200">Concierge Support Desk</span>
            </div>
            <button
              type="button"
              onClick={onOpenCustomerCare}
              className="px-4 py-2 rounded-xl bg-[#D50A0A] hover:bg-[#B91C1C] text-white text-[11px] font-extrabold uppercase tracking-wider shrink-0 cursor-pointer"
            >
              Ask Concierge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
