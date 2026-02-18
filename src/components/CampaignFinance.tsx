import { Icon } from "@/components/icons";
import type { CampaignFinanceData } from "@/db/queries/campaign-finance";

export interface CampaignFinanceProps {
  data: CampaignFinanceData | null;
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

export function CampaignFinance({ data }: CampaignFinanceProps) {
  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Campaign finance data not available.</p>
      </div>
    );
  }

  const debtsOwed = data.debtsOwed != null && data.debtsOwed > 0 ? data.debtsOwed : null;

  return (
    <div>
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

        {data.sourceUrl && (
          <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
            <Icon name="external-link" className="w-3 h-3" />
            <a
              href={data.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Data from FEC.gov
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
