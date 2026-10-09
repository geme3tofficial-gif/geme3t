import { BrandedLoader } from "@/components/geme3t/branded-loader";

export default function Loading() {
  return (
    <main aria-busy="true" className="branded-loading-screen">
      <BrandedLoader />
    </main>
  );
}
