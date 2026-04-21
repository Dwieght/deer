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
  const pendingReview = paymentSubmissions.filter((submission) => !submission.matched).length;

  return (
    <>
      <section className="section dashboard-section" id="dashboard-overview">
        <div className="dashboard-page-header">
          <div className="dashboard-page-heading">
            <p className="dashboard-kicker">Operations</p>
            <h1>Admin overview</h1>
            <p>
              Review community activity, verify contributions, and keep content workflows moving without bouncing
              between sections.
            </p>
          </div>
        </div>
        <div className="dashboard-grid dashboard-grid-stats">
          <div className="stat-card">
            <p className="stat-label">Total Received</p>
            <p className="stat-value">{formatAmount(totalContribution)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Matched Contributions</p>
            <p className="stat-value">{matchedContributions.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Needs Review</p>
            <p className="stat-value">{pendingReview}</p>
          </div>
        </div>
      </section>

      <section className="section dashboard-section" id="dashboard-contributions">
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-kicker">Payments</p>
              <h2>Contribution trend</h2>
              <p>Weekly totals based on matched payment references with recorded amounts.</p>
            </div>
          </div>
          <div className="contribution-summary">
            <div className="stat-card">
              <p className="stat-label">Tracking Window</p>
              <p className="stat-value">{weeklyTotals.length} weeks</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Highest Week</p>
              <p className="stat-value">
                {formatAmount(Math.max(...weeklyTotals.map((week) => week.total), 0))}
              </p>
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
        </div>
      </section>
    </>
  );
}
