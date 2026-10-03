import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GEME3T Academy | Learn skills. Earn opportunities.",
    template: "%s | GEME3T Academy",
  },
  description:
    "Build practical, in-demand skills with GEME3T Academy's flexible, beginner-friendly courses and expert mentorship.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
