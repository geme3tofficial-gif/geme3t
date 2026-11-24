"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const BANNER_WIDTH = 1200;
const SERVICE_PANEL_TOP = 520;
const SERVICE_ROW_HEIGHT = 34;
const SERVICE_PANEL_PADDING = 84;

function bannerHeight(serviceCount: number) {
  const rows = Math.max(1, Math.ceil(serviceCount / 2));
  return SERVICE_PANEL_TOP + SERVICE_PANEL_PADDING + rows * SERVICE_ROW_HEIGHT + 48;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function drawBanner(
  context: CanvasRenderingContext2D,
  couponCode: string,
  services: string[],
) {
  const height = bannerHeight(services.length);
  const background = context.createLinearGradient(0, 0, BANNER_WIDTH, height);
  background.addColorStop(0, "#082f26");
  background.addColorStop(1, "#145c43");
  context.fillStyle = background;
  context.fillRect(0, 0, BANNER_WIDTH, height);

  context.fillStyle = "rgba(255,255,255,0.06)";
  context.beginPath();
  context.arc(1110, 35, 230, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#d62839";
  context.beginPath();
  context.arc(82, 77, 25, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "700 29px Arial, sans-serif";
  context.textAlign = "center";
  context.fillText("G", 82, 87);

  context.textAlign = "left";
  context.fillStyle = "#ffffff";
  context.font = "700 26px Arial, sans-serif";
  context.fillText("GEME3T", 122, 74);
  context.fillStyle = "#bfe5cd";
  context.font = "700 15px Arial, sans-serif";
  context.fillText("DIGITAL SERVICES", 123, 99);

  context.fillStyle = "#ffffff";
  context.font = "700 55px Arial, sans-serif";
  context.fillText("Digital services from", 72, 220);
  context.fillText("the comfort of your home", 72, 286);
  context.fillStyle = "#d9eee3";
  context.font = "400 27px Arial, sans-serif";
  context.fillText("Use my coupon code to get cheaper price", 74, 348);
  context.fillText("on any service", 74, 386);

  context.fillStyle = "#d62839";
  roundedRect(context, 72, 414, 700, 92, 18);
  context.fill();
  context.fillStyle = "#ffe8ea";
  context.font = "700 14px Arial, sans-serif";
  context.fillText("MY COUPON CODE", 101, 448);
  context.fillStyle = "#ffffff";
  context.font = "700 36px Arial, sans-serif";
  context.fillText(couponCode, 100, 487);

  context.fillStyle = "rgba(214,40,57,0.22)";
  context.beginPath();
  context.arc(1005, 285, 158, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#f3fbf5";
  context.lineWidth = 12;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(927, 292);
  context.lineTo(1005, 226);
  context.lineTo(1083, 292);
  context.lineTo(1083, 360);
  context.lineTo(927, 360);
  context.closePath();
  context.stroke();
  context.strokeStyle = "#d62839";
  context.lineWidth = 11;
  context.strokeRect(986, 311, 38, 49);
  context.fillStyle = "#f3fbf5";
  context.font = "700 16px Arial, sans-serif";
  context.textAlign = "center";
  context.fillText("FROM HOME", 1005, 397);
  context.textAlign = "left";

  context.fillStyle = "#f7fbf8";
  roundedRect(context, 64, SERVICE_PANEL_TOP, 1072, height - SERVICE_PANEL_TOP - 28, 22);
  context.fill();
  context.fillStyle = "#145c43";
  context.font = "700 23px Arial, sans-serif";
  context.fillText("SERVICES WE OFFER", 92, SERVICE_PANEL_TOP + 42);
  context.fillStyle = "#d62839";
  roundedRect(context, 92, SERVICE_PANEL_TOP + 56, 70, 5, 3);
  context.fill();

  if (services.length === 0) {
    context.fillStyle = "#145c43";
    context.font = "400 18px Arial, sans-serif";
    context.fillText("Contact us for our current service list.", 92, SERVICE_PANEL_TOP + 99);
  } else {
    const columnSize = Math.ceil(services.length / 2);
    services.forEach((service, index) => {
      const column = index < columnSize ? 0 : 1;
      const row = column === 0 ? index : index - columnSize;
      const x = column === 0 ? 98 : 625;
      const y = SERVICE_PANEL_TOP + 98 + row * SERVICE_ROW_HEIGHT;
      context.fillStyle = "#d62839";
      context.beginPath();
      context.arc(x, y - 6, 5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#164632";
      context.font = "400 17px Arial, sans-serif";
      context.fillText(service, x + 17, y, 465);
    });
  }

  context.fillStyle = "rgba(255,255,255,0.78)";
  context.font = "400 15px Arial, sans-serif";
  context.fillText("Share your code with friends and family", 72, height - 12);
}

export function CustomerCouponAdBanner({
  couponCode,
  services,
}: {
  couponCode: string;
  services: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const imageHeight = bannerHeight(services.length);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) drawBanner(context, couponCode, services);
  }, [couponCode, services]);

  function downloadBanner() {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext("2d")) {
      toast.error("The coupon banner is not ready to download yet.");
      return;
    }

    setIsDownloading(true);
    canvas.toBlob((blob) => {
      setIsDownloading(false);
      if (!blob) {
        toast.error("Could not create the coupon banner image.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileCode = couponCode.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      link.download = `geme3t-coupon-${fileCode}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Coupon ad banner downloaded.");
    }, "image/png");
  }

  return (
    <section aria-label="Download your coupon advertisement" className="customer-coupon-ad-banner">
      <div className="customer-coupon-ad-banner-heading">
        <div>
          <h3>Share your coupon</h3>
          <p>Download this banner and send it to friends and family.</p>
        </div>
        <button
          className="button button--small"
          disabled={isDownloading}
          onClick={downloadBanner}
          type="button"
        >
          {isDownloading ? "Preparing banner..." : "Download banner (PNG)"}
        </button>
      </div>
      <canvas
        aria-label={`GEME3T Digital Services. Digital services from the comfort of your home. Use my coupon code to get cheaper price on any service. Coupon code ${couponCode}. Services offered: ${services.join(", ")}.`}
        className="customer-coupon-ad-banner-image"
        height={imageHeight}
        ref={canvasRef}
        role="img"
        width={BANNER_WIDTH}
      />
    </section>
  );
}
