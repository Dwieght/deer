import { prisma } from "../../lib/prisma";
import { buildWeeklyTotals, formatAmount } from "./utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const paymentSubmissions = await prisma.paymentSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  const matchedContributions = paymentSubmissions.filter(
    (submission) => submission.matched && submission.amount && submission.amount > 0
  );
  const totalContribution = matchedContributions.reduce((sum, item) => sum + (item.amount || 0), 0);
  const weeklyTotals = buildWeeklyTotals(paymentSubmissions, 8);
  const maxWeeklyTotal = Math.max(...weeklyTotals.map((week) => week.total), 1);

  return (
    <>
      <section className="section" id="dashboard-overview">
        <div className="section-header">
          <div>
            <h2>Dashboard</h2>
            <p>Publish updates, manage fan content, and review submissions.</p>
          </div>
          <img className="section-icon" src="/assets/deer-mark.svg" alt="Deer icon" />
        </div>
      </section>

      <section className="section" id="dashboard-contributions">
        <div className="section-header">
          <div>
            <h2>Contribution Dashboard</h2>
            <p>Weekly totals based on matched payments with recorded amounts.</p>
          </div>
        </div>
        <div className="contribution-summary">
          <div className="stat-card">
            <p className="stat-label">Total Received</p>
            <p className="stat-value">{formatAmount(totalContribution)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Matched Contributions</p>
            <p className="stat-value">{matchedContributions.length}</p>
          </div>
        </div>
        <div className="chart" role="img" aria-label="Weekly contribution totals">
          {weeklyTotals.map((week) => (
            <div key={week.key} className="chart-col">
              <div
                className="chart-bar"
                style={{ height: `${(week.total / maxWeeklyTotal) * 100}%` }}
                title={`${week.label}: ${formatAmount(week.total)}`}
              />
              <span className="chart-label">{week.label}</span>
              <span className="chart-value">{formatAmount(week.total)}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
