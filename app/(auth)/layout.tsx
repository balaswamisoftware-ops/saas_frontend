import type { ReactNode } from "react";
import { Brand } from "@/components/layout/brand";

/** Centered shell for all authentication screens. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-default-50 flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        {children}
      </div>
    </div>
  );
}
