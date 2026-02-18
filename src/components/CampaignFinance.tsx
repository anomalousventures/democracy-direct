import { Icon } from "@/components/icons";
import { sanitizeExternalUrl } from "@/lib/url";
import type {
  CampaignFinanceData,
  TopPacDonor,
  IndependentExpenditureWithCommittee,
} from "@/db/queries/campaign-finance";

export interface CampaignFinanceProps {
  data: CampaignFinanceData | null;
  topPacDonors?: TopPacDonor[];
  independentExpenditures?: IndependentExpenditureWithCommittee[];
  bioguideId?: string;
}

const currencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return currencyFormat.format(value);
}

function FundingBreakdownBar({
  totalFromPACs,
  totalFromIndividuals,
  totalReceipts,
}: {
  totalFromPACs: number;
  totalFromIndividuals: number;
  totalReceipts: number;
}) {
  if (totalReceipts === 0) return null;

  const other = Math.max(0, totalReceipts - totalFromPACs - totalFromIndividuals);
  const pacPercent = Math.round((totalFromPACs / totalReceipts) * 100);
  const individualPercent = Math.round((totalFromIndividuals / totalReceipts) * 100);
  const otherPercent = Math.max(0, 100 - pacPercent - individualPercent);

  const segments = [
    {
      label: "PACs",
      percent: pacPercent,
      amount: totalFromPACs,
      testId: "pac-bar",
      color: "bg-accent",
    },
    {
      label: "Individuals",
      percent: individualPercent,
      amount: totalFromIndividuals,
      testId: "individual-bar",
      color: "bg-primary",
    },
    ...(otherPercent > 0
      ? [
          {
            label: "Other",
            percent: otherPercent,
            amount: other,
            testId: "other-bar",
            color: "bg-muted-foreground/30",
          },
        ]
      : []),
  ];

  const ariaLabel = segments.map((s) => `${s.percent}% from ${s.label.toLowerCase()}`).join(", ");

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
        {segments.map((s) => (
          <span key={s.label}>
            {s.label} <span className="font-medium text-foreground">{s.percent}%</span>
          </span>
        ))}
      </div>
      <div
        className="flex h-3 rounded-sm overflow-hidden border border-border"
        role="img"
        aria-label={`Funding breakdown: ${ariaLabel}`}
      >
        {segments.map((s) => (
          <div
            key={s.testId}
            className={`${s.color} transition-all duration-300`}
            style={{ width: `${s.percent}%` }}
            data-testid={s.testId}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        {segments.map((s) => (
          <span key={s.label}>{formatCurrency(s.amount)}</span>
        ))}
      </div>
    </div>
  );
}

function TopPacDonors({ donors }: { donors: TopPacDonor[] }) {
  if (donors.length === 0) return null;

  return (
    <div className="p-4 bg-secondary border border-border rounded-sm" data-testid="top-pac-donors">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Top PAC Donors</p>
      <ul className="space-y-2">
        {donors.map((donor) => (
          <li key={donor.committeeId} className="flex items-center justify-between gap-2">
            <a
              href={`/committee/${donor.committeeId}`}
              className="text-sm text-primary hover:underline truncate"
            >
              {donor.committee.name}
            </a>
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              {formatCurrency(donor.totalAmount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IndependentExpenditureSummary({
  expenditures,
}: {
  expenditures: IndependentExpenditureWithCommittee[];
}) {
  if (expenditures.length === 0) return null;

  let totalSupport = 0;
  let totalOppose = 0;
  for (const exp of expenditures) {
    if (exp.supportOppose === "S") totalSupport += exp.totalAmount;
    else if (exp.supportOppose === "O") totalOppose += exp.totalAmount;
  }

  if (totalSupport === 0 && totalOppose === 0) return null;

  return (
    <div
      className="p-4 bg-secondary border border-border rounded-sm"
      data-testid="independent-expenditures"
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
        Independent Expenditures
      </p>
      <div className="grid grid-cols-2 gap-3">
        {totalSupport > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Supporting</p>
            <p className="text-base font-semibold text-green-600">{formatCurrency(totalSupport)}</p>
          </div>
        )}
        {totalOppose > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Opposing</p>
            <p className="text-base font-semibold text-destructive">
              {formatCurrency(totalOppose)}
            </p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        from {expenditures.length} {expenditures.length === 1 ? "committee" : "committees"}
      </p>
    </div>
  );
}

export function CampaignFinance({
  data,
  topPacDonors = [],
  independentExpenditures = [],
  bioguideId,
}: CampaignFinanceProps) {
  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Campaign finance data not available.</p>
      </div>
    );
  }

  const debtsOwed = data.debtsOwed != null && data.debtsOwed > 0 ? data.debtsOwed : null;
  const sanitizedSourceUrl = sanitizeExternalUrl(data.sourceUrl);

  return (
    <div data-testid="campaign-finance-section">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">{data.cycle} Cycle</span>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-secondary border border-border rounded-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Raised</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(data.totalReceipts)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-secondary border border-border rounded-sm">
            <p className="text-xs text-muted-foreground mb-1">Spent</p>
            <p className="text-base font-semibold text-primary">
              {formatCurrency(data.totalDisbursements)}
            </p>
          </div>
          <div className="p-3 bg-secondary border border-border rounded-sm">
            <p className="text-xs text-muted-foreground mb-1">Cash on Hand</p>
            <p className="text-base font-semibold text-primary">
              {formatCurrency(data.cashOnHand)}
            </p>
          </div>
        </div>

        {debtsOwed !== null && (
          <div
            className="p-3 bg-secondary border border-border rounded-sm"
            data-testid="debts-section"
          >
            <p className="text-xs text-muted-foreground mb-1">Debts Owed</p>
            <p className="text-base font-semibold text-destructive">{formatCurrency(debtsOwed)}</p>
          </div>
        )}

        <div className="p-4 bg-secondary border border-border rounded-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
            Funding Sources
          </p>
          <FundingBreakdownBar
            totalFromPACs={data.totalFromPACs}
            totalFromIndividuals={data.totalFromIndividuals}
            totalReceipts={data.totalReceipts}
          />
        </div>

        <TopPacDonors donors={topPacDonors} />

        <IndependentExpenditureSummary expenditures={independentExpenditures} />

        <div className="flex items-center justify-between">
          {sanitizedSourceUrl && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="external-link" className="w-3 h-3" />
              <a
                href={sanitizedSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Data from FEC.gov
              </a>
            </div>
          )}
          {bioguideId && (
            <a
              href={`/rep/${bioguideId}/finance`}
              className="text-xs text-primary hover:underline"
              data-testid="finance-detail-link"
            >
              View full finance details
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
