import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <Link aria-label="GEME3T Academy home" className="brand-link" href="/">
      <Image
        alt="GEME3T"
        className="brand-logo"
        height={408}
        src="/images/logo-no-bg.png"
        width={612}
      />
      <span className="brand-name">
        <span>Academy</span>
      </span>
    </Link>
  );
}
