import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { Brand } from "@/components/layout/brand";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <div className="bg-default-50 flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between p-6">
        <Brand />
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Sign in
          </Link>
          <Link href="/login" className={buttonVariants({ variant: "primary" })}>
            Platform login
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="bg-primary/10 text-primary mb-5 rounded-full px-3 py-1 text-sm font-medium">
          Multi-tenant CRM for service organisations
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Run your sevas, devotees &amp; donations in one place
        </h1>
        <p className="text-foreground/60 mt-4 max-w-xl text-lg">{siteConfig.description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Platform login
          </Link>
          <Link
            href="/saas/dashboard"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            View platform console
          </Link>
        </div>
      </main>

      <footer className="text-foreground/50 mx-auto w-full max-w-6xl p-6 text-center text-sm">
        © {siteConfig.company} · {siteConfig.name}
      </footer>
    </div>
  );
}
