import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tsacademyonline.com"),
  title: {
    default: "GEME3T Academy | Learn skills. Earn opportunities.",
    template: "%s | GEME3T Academy",
  },
  description:
    "Build practical, in-demand skills with GEME3T Academy's flexible, beginner-friendly courses and expert mentorship.",
  openGraph: {
    type: "website",
    url: "/",
    title: "GEME3T Academy | Learn skills. Earn opportunities.",
    description:
      "Build practical, in-demand skills with GEME3T Academy's flexible, beginner-friendly courses and expert mentorship.",
    siteName: "GEME3T Academy",
    images: [
      {
        url: "/images/banner.png",
        width: 1536,
        height: 1024,
        alt: "GEME3T Academy banner",
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
