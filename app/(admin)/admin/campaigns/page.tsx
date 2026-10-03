import type { Metadata } from "next";
import { PromoCampaignForm } from "@/components/geme3t/promo-campaign-form";

export const metadata: Metadata = {
  title: "Promo campaigns",
  description: "Create and preview GEME3T Academy course discount campaigns.",
};

export default function PromoCampaignsPage() {
  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Admin tools · promotions</span>
          <h1>Promo campaigns</h1>
          <p>Create a course discount code and schedule your promotion.</p>
        </div>
      </div>
      <PromoCampaignForm />
    </>
  );
}
