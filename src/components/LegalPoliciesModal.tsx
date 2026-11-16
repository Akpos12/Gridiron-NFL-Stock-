import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Mail,
  ShieldCheck,
  FileText,
  RefreshCw,
  HeartHandshake,
  ExternalLink,
} from "lucide-react";
import { CHARITY_ALLOCATION, GridironBrandMark } from "./common/GridironBrandMark";

export type LegalTabId =
  | "about"
  | "contact"
  | "charity"
  | "privacy"
  | "terms"
  | "refund";

interface LegalPoliciesModalProps {
  isOpen: boolean;
  initialTab?: LegalTabId;
  onClose: () => void;
}

const TABS: { id: LegalTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "about", label: "About Us", icon: Building2 },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "charity", label: "Charitable Initiative", icon: HeartHandshake },
  { id: "privacy", label: "Privacy Policy", icon: ShieldCheck },
  { id: "terms", label: "Terms & Conditions", icon: FileText },
  { id: "refund", label: "Refund & Cancellation", icon: RefreshCw },
];

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  initialTab = "about",
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabId>(initialTab);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#050816] border border-[#013369]/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 sm:px-7 sm:py-5 bg-[#03050C] border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <GridironBrandMark size="sm" />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                Trust, Transparency &amp; Governance
              </h2>
              <p className="text-xs text-zinc-400 truncate">
                {CHARITY_ALLOCATION.operatorLegalName} · {CHARITY_ALLOCATION.websiteDomain}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close legal and transparency dialog"
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 py-3 bg-[#08112B]/80 border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-2 transition-all cursor-pointer border ${
                  active
                    ? "bg-[#013369] text-white border-blue-400/50 shadow-md"
                    : "bg-[#03050C]/70 text-zinc-300 border-white/10 hover:text-white hover:border-white/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar space-y-6 text-sm text-zinc-300 leading-relaxed">
          {activeTab === "about" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  About {CHARITY_ALLOCATION.operatorLegalName}
                </h3>
                <p>
                  <strong className="text-white">{CHARITY_ALLOCATION.websiteDomain}</strong> is operated by{" "}
                  <strong className="text-white">{CHARITY_ALLOCATION.operatorLegalName}</strong>, an independent sports hospitality, memorabilia, and private fan-experience coordination service based in the United States.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#03050C] border border-[#013369]/50 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  Hospitality Coordination Standards
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Gridiron Fan Hospitality LLC coordinates private fan hospitality requests, meet-and-greet invitation windows, and autographed memorabilia. All team and athlete references describe fan hospitality request preferences.
                </p>
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1.5">How Our Invitation Coordination Works</h4>
                <p className="text-xs sm:text-sm text-zinc-300">
                  Fans submit an invitation request ($100) indicating their preferred player. Our hospitality desk reviews event calendars, appearance windows, and authorized venue access. All invitations remain strictly subject to player availability, confirmed public/private events, and authorized arrangements. When an upcoming window opens, an update notice is delivered directly to your inquiry inbox and email address.
                </p>
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-white">Contact &amp; Fan Concierge Support</h3>
              <p>
                Need assistance with an existing meet-and-greet invitation, payment verification, or charitable ledger record? Reach our concierge team directly through any channel below:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-xl bg-[#03050C] border border-white/10 space-y-1">
                  <span className="text-sky-400 font-bold uppercase text-[11px] tracking-wider block">
                    Concierge &amp; Invitations Desk
                  </span>
                  <p className="text-white font-semibold">{CHARITY_ALLOCATION.supportEmail}</p>
                  <p className="text-zinc-400 text-xs">Response SLA: Within 4 business hours</p>
                </div>
                <div className="p-4 rounded-xl bg-[#03050C] border border-white/10 space-y-1">
                  <span className="text-sky-400 font-bold uppercase text-[11px] tracking-wider block">
                    Payment &amp; Receipt Verification
                  </span>
                  <p className="text-white font-semibold">billing@nflgridiron.company</p>
                  <p className="text-zinc-400 text-xs">Include your 8-character Inquiry Reference ID</p>
                </div>
                <div className="p-4 rounded-xl bg-[#03050C] border border-white/10 space-y-1 sm:col-span-2">
                  <span className="text-sky-400 font-bold uppercase text-[11px] tracking-wider block">
                    Operating Entity &amp; Mailing Correspondence
                  </span>
                  <p className="text-white font-semibold">{CHARITY_ALLOCATION.operatorLegalName}</p>
                  <p className="text-zinc-400 text-xs">
                    701 Fifth Avenue, Suite 4200, Seattle, WA 98104 · Operating Hours: Mon–Sun, 9:00 AM – 8:00 PM PT
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "charity" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Charitable Initiative: Supporting {CHARITY_ALLOCATION.beneficiary}
                </h3>
                <p>
                  Be part of something bigger than the game. Through our independent charitable initiative, we earmark a transparent portion of every verified $100 meet-and-greet invitation request to support youth education, mentorship, leadership development, and safe community programs provided by{" "}
                  <strong className="text-white">{CHARITY_ALLOCATION.beneficiary}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-[#03050C] border border-white/10">
                  <span className="text-zinc-400 block mb-1">Coordination &amp; Platform Fee</span>
                  <span className="text-xl font-mono font-bold text-white">
                    ${CHARITY_ALLOCATION.coordinationFeeUsd}.00
                  </span>
                  <p className="text-zinc-400 mt-1">
                    Covers payment processing, concierge scheduling research, and customer notifications.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#03050C] border border-blue-500/35">
                  <span className="text-sky-400 block mb-1 font-semibold">
                    Earmarked Charitable Contribution
                  </span>
                  <span className="text-xl font-mono font-bold text-emerald-400">
                    ${CHARITY_ALLOCATION.charitableContributionUsd}.00
                  </span>
                  <p className="text-zinc-300 mt-1">
                    Allocated per verified $100 invitation toward youth community grants.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#03050C] border border-white/10">
                  <span className="text-zinc-400 block mb-1">Transfer Cadence</span>
                  <span className="text-sm font-bold text-white block">Monthly Consolidated ACH</span>
                  <p className="text-zinc-400 mt-1">
                    Recorded in our public Charitable Ledger with transfer dates and settlement references.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#013369]/25 border border-blue-500/30 text-xs text-zinc-200 space-y-1.5">
                <strong className="block uppercase tracking-wider text-sky-400">
                  Mandatory Charitable Accuracy Disclosure
                </strong>
                <p>
                  Gridiron Fan Hospitality LLC does NOT claim an official partnership, sponsorship, or co-branded agreement with Boys &amp; Girls Clubs of America. Because our platform fee ($75.00) covers operational hospitality coordination, the full $100 is never represented as tax-deductible or as a 100% pass-through donation. Verified disbursements ($25.00 per completed $100 invitation) are tracked individually in our platform ledger.
                </p>
                <a
                  href="https://www.bgca.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sky-400 hover:text-white underline font-semibold pt-1"
                >
                  Learn more about Boys &amp; Girls Clubs of America at bgca.org
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Privacy &amp; Data Protection Policy</h3>
              <p>
                <strong>1. Zero Stored Card Credentials:</strong> Card transactions are processed via hosted third-party tokenization (Stripe Checkout). Complete debit/credit card numbers, expiration dates, and CVV codes are never transmitted to or stored within {CHARITY_ALLOCATION.websiteDomain} databases.
              </p>
              <p>
                <strong>2. Inquiry &amp; Verification Data:</strong> We collect only the contact details (name, email, phone number) and payment proof receipts you voluntarily upload to verify your reservation or communicate status updates in your inquiry inbox.
              </p>
              <p>
                <strong>3. Retention &amp; Deletion Rights:</strong> Customers may request export or permanent deletion of their inquiry record at any time by contacting {CHARITY_ALLOCATION.supportEmail}.
              </p>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Terms &amp; Conditions</h3>
              <p>
                <strong>1. Invitation Subjectivity:</strong> Every $100 player meet-and-greet invitation request is subject to athlete availability, confirmed public or private hospitality events, venue security clearance, and authorized event arrangements. Submitting an initial request secures placement in our invitation coordination queue and triggers notifications when an upcoming invite becomes available.
              </p>
              <p>
                <strong>2. Payment Verification Requirement:</strong> Manual payment methods (Zelle, Cash App, Venmo, PayPal, Crypto, Gift Card) require genuine proof-of-payment upload and administrative verification before any order or request is marked as paid or approved.
              </p>
              <p>
                <strong>3. Conduct &amp; Credential Transferability:</strong> Issued passes are strictly non-transferable unless authorized by our concierge desk in advance.
              </p>
            </div>
          )}

          {activeTab === "refund" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Refund &amp; Cancellation Policy</h3>
              <p>
                <strong>1. Pending / Unscheduled Requests:</strong> If a meet-and-greet invitation cannot be accommodated within 60 days of payment verification—or if an administrator declines a request prior to confirmed pass issuance—you may request a full refund of your invitation payment to your original payment method.
              </p>
              <p>
                <strong>2. Confirmed Passes &amp; Merchandise:</strong> Once digital gate credentials or shipped memorabilia tracking has been issued, cancellations are eligible only if an underlying official event is postponed or canceled without a rescheduled window.
              </p>
              <p>
                <strong>3. How to Request a Refund:</strong> Email{" "}
                <strong className="text-white">{CHARITY_ALLOCATION.supportEmail}</strong> with your Order / Inquiry Reference ID. Approved refunds are processed within 5–7 business days.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#03050C] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-zinc-400">
            Operated by {CHARITY_ALLOCATION.operatorLegalName}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-[#013369] hover:bg-[#1D4ED8] text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
