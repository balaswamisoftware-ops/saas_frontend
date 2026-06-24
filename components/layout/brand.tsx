import Link from "next/link";
import { Flower2 } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export interface BrandProps {
  href?: string;
  /** Optional sub-label, e.g. the current console name. */
  subtitle?: string;
  className?: string;
}

/** Product logo + wordmark. */
export function Brand({ href = "/", subtitle, className }: BrandProps) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-xl">
        <Flower2 className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block font-semibold tracking-tight">{siteConfig.name}</span>
        {subtitle ? (
          <span className="text-foreground/50 block text-xs">{subtitle}</span>
        ) : null}
      </span>
    </Link>
  );
}
