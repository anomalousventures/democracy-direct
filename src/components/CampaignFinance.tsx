import { Icon } from "@/components/icons";
import type { CampaignFinanceData } from "@/db/queries/campaign-finance";

export interface CampaignFinanceProps {
  data: CampaignFinanceData | null;
  sourceUrl?: string | null;
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
}: {
  totalFromPACs: number;
  totalFromIndividuals: number;
}) {
  const total = totalFromPACs + totalFromIndividuals;
  if (total === 0) return null;

  const pacPercent = Math.round((totalFromPACs / total) * 100);
  const individualPercent = 100 - pacPercent;

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
        <span>
          PACs <span className="font-medium text-foreground">{pacPercent}%</span>
        </span>
        <span>
          Individuals <span className="font-medium text-foreground">{individualPercent}%</span>
        </span>
      </div>
      <div
        className="flex h-3 rounded-sm overflow-hidden border border-border"
        role="img"
        aria-label={`Funding breakdown: ${pacPercent}% from PACs, ${individualPercent}% from individuals`}
      >
        <div
          className="bg-accent transition-all duration-300"
          style={{ width: `${pacPercent}%` }}
          data-testid="pac-bar"
        />
        <div
          className="bg-primary transition-all duration-300"
          style={{ width: `${individualPercent}%` }}
          data-testid="individual-bar"
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{formatCurrency(totalFromPACs)}</span>
        <span>{formatCurrency(totalFromIndividuals)}</span>
      </div>
    </div>
  );
}

export function CampaignFinance({ data, sourceUrl }: CampaignFinanceProps) {
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
        <h2 className="text-lg font-semibold text-primary">Campaign Finance</h2>
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
          />
        </div>

        {sourceUrl && (
          <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
            <Icon name="external-link" className="w-3 h-3" />
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Data from ProPublica / FEC.gov
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
