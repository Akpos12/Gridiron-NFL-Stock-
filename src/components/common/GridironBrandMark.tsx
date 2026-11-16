import React from "react";

export const CHARITY_ALLOCATION = {
  beneficiary: "Boys & Girls Clubs of America",
  invitationTotalUsd: 100,
  coordinationFeeUsd: 75,
  charitableContributionUsd: 25,
  charitablePercent: 25,
  transferCadence: "Monthly consolidated organizational disbursement",
  operatorLegalName: "Gridiron Fan Hospitality LLC",
  websiteDomain: "www.nflgridiron.company",
  supportEmail: "concierge@nflgridiron.company",
} as const;

interface GridironBrandMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const GridironBrandMark: React.FC<GridironBrandMarkProps> = ({
  className = "",
  size = "md",
}) => {
  const dims =
    size === "sm"
      ? "w-9 h-9"
      : size === "lg"
      ? "w-14 h-16"
      : "w-11 h-11";

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-[#050816] border border-[#013369]/60 shadow-[0_0_20px_rgba(1,51,105,0.3)] shrink-0 overflow-hidden ${dims} ${className}`}
    >
      <img
        src="/nfl_logo.svg"
        alt="NFL Shield Logo"
        className="w-full h-full object-contain p-1"
      />
    </div>
  );
};
