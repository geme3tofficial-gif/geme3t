"use client";

import { useEffect, useState, type FormEvent } from "react";
import { courses } from "@/lib/site-data";

const storageKey = "geme3t-admin-promo-campaigns";

type Campaign = {
  id: string;
  name: string;
  code: string;
  discount: number;
  course: string;
  startsOn: string;
  endsOn: string;
  redemptionLimit: number | null;
  launchedAt: string;
};

function isCampaign(value: unknown): value is Campaign {
  if (!value || typeof value !== "object") return false;

  const campaign = value as Record<string, unknown>;
  return (
    typeof campaign.id === "string" &&
    typeof campaign.name === "string" &&
    typeof campaign.code === "string" &&
    typeof campaign.discount === "number" &&
    typeof campaign.course === "string" &&
    typeof campaign.startsOn === "string" &&
    typeof campaign.endsOn === "string" &&
    (typeof campaign.redemptionLimit === "number" ||
      campaign.redemptionLimit === null) &&
    typeof campaign.launchedAt === "string"
  );
}

function campaignStatus(campaign: Campaign, today: string) {
  if (campaign.endsOn < today) return "Ended";
  if (campaign.startsOn > today) return "Scheduled";
  return "Active";
}

export function PromoCampaignForm() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (!Array.isArray(parsed) || !parsed.every(isCampaign)) {
            throw new Error("Saved campaign data is invalid.");
          }
          setCampaigns(parsed);
        }
        setStorageReady(true);
      } catch {
        setStorageError(
          "Campaign storage is unavailable or contains invalid data. Check browser storage before launching a campaign.",
        );
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function launchCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setStorageError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const startsOn = String(formData.get("startsOn"));
    const endsOn = String(formData.get("endsOn"));
    const name = String(formData.get("name")).trim();
    const code = String(formData.get("code")).trim().toUpperCase();
    if (!name || !code) {
      setMessage("Enter a campaign name and promo code.");
      return;
    }
    if (campaigns.some((campaign) => campaign.code === code)) {
      setMessage("That promo code is already in use. Choose a different code.");
      return;
    }
    if (endsOn < startsOn) {
      setMessage("The end date must be on or after the start date.");
      return;
    }

    const limitValue = String(formData.get("redemptionLimit") ?? "");
    const campaign: Campaign = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      code,
      discount: Number(formData.get("discount")),
      course: String(formData.get("course")),
      startsOn,
      endsOn,
      redemptionLimit: limitValue ? Number(limitValue) : null,
      launchedAt: new Date().toISOString(),
    };
    const nextCampaigns = [campaign, ...campaigns];

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextCampaigns));
      setCampaigns(nextCampaigns);
      setMessage(
        `“${campaign.name}” was launched in this browser preview. Connect your payments or LMS backend before sharing this code with learners.`,
      );
      form.reset();
    } catch {
      setStorageError(
        "This campaign could not be saved in browser storage, so it was not launched. Check your browser storage settings and try again.",
      );
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="campaign-page-grid">
      <section className="dashboard-panel campaign-form-panel">
        <div className="workspace-panel-heading">
          <div>
            <h2>Campaign details</h2>
            <p>Set up a discount code and choose when it can be used.</p>
          </div>
        </div>

        <form className="campaign-form" onSubmit={launchCampaign}>
          <label>
            Campaign name
            <input
              autoComplete="off"
              maxLength={80}
              name="name"
              placeholder="e.g. October intake offer"
              required
            />
          </label>
          <label>
            Promo code
            <input
              autoComplete="off"
              maxLength={24}
              minLength={4}
              name="code"
              pattern="[A-Za-z0-9-]+"
              placeholder="e.g. LEARN20"
              required
              title="Use letters, numbers, and hyphens only."
            />
            <span className="campaign-field-hint">
              Learners will enter this code at checkout.
            </span>
          </label>
          <div className="campaign-form-row">
            <label>
              Discount
              <span className="campaign-input-suffix">
                <input
                  max={90}
                  min={1}
                  name="discount"
                  required
                  type="number"
                  defaultValue={20}
                />
                <span>%</span>
              </span>
            </label>
            <label>
              Applies to
              <select defaultValue="all" name="course">
                <option value="all">All courses</option>
                {courses.map((course) => (
                  <option key={course.slug} value={course.slug}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="campaign-form-row">
            <label>
              Starts on
              <input name="startsOn" required type="date" />
            </label>
            <label>
              Ends on
              <input name="endsOn" required type="date" />
            </label>
          </div>
          <label>
            Redemption limit <span className="campaign-optional">(optional)</span>
            <input
              min={1}
              name="redemptionLimit"
              placeholder="Leave blank for unlimited uses"
              type="number"
            />
          </label>
          {!storageReady && !storageError && (
            <p className="campaign-field-hint">Checking campaign storage…</p>
          )}
          {storageError && (
            <p className="campaign-message campaign-message--error" role="alert">
              {storageError}
            </p>
          )}
          {message && (
            <p className="campaign-message" role="status">
              {message}
            </p>
          )}
          <button
            className="button"
            disabled={!storageReady || Boolean(storageError)}
            type="submit"
          >
            Launch campaign <span aria-hidden="true">→</span>
          </button>
          <p className="campaign-disclaimer">
            Preview only: campaigns are saved in this browser and are not
            published to learners or connected to payments.
          </p>
        </form>
      </section>

      <aside className="campaign-aside">
        <section className="dashboard-panel campaign-preview">
          <span className="eyebrow">How it works</span>
          <h2>Ready to reward your learners?</h2>
          <p>
            Create a code, select the eligible courses, and set the offer
            dates. You can review the campaign in this browser after launch.
          </p>
          <ul>
            <li>Discounts from 1% to 90%</li>
            <li>Apply the offer to one course or all courses</li>
            <li>Schedule a start and end date</li>
            <li>Optionally limit the number of redemptions</li>
          </ul>
        </section>
        <section className="dashboard-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Campaign history</h2>
              <p>Saved in this browser preview.</p>
            </div>
            <span className="workspace-count">{campaigns.length}</span>
          </div>
          {campaigns.length === 0 ? (
            <p className="campaign-empty">Your launched campaigns will appear here.</p>
          ) : (
            <div className="campaign-history">
              {campaigns.map((campaign) => (
                <article className="campaign-history-item" key={campaign.id}>
                  <div>
                    <strong>{campaign.name}</strong>
                    <span>
                      {campaign.code} · {campaign.discount}% off
                    </span>
                    <span>
                      {campaign.startsOn} – {campaign.endsOn}
                    </span>
                  </div>
                  <span className="workspace-status">
                    {campaignStatus(campaign, today)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
