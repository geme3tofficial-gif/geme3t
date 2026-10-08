export function PromoCampaignForm() {
  return (
    <section className="dashboard-panel">
      <h2>Campaign storage is not connected</h2>
      <p className="campaign-empty">
        Campaigns can be created after the Supabase database is configured and
        the database migrations have been applied. No campaign data is being
        stored in this browser.
      </p>
    </section>
  );
}
