"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { Button, toast } from "@/components/ui";
import { cn } from "@/lib/utils";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export interface LogoUploadProps {
  /** Current logo URL (e.g. from S3). */
  value?: string;
  /** Called with the uploaded file's public URL, or "" when removed. */
  onChange: (url: string) => void;
  /** Uploads the file and resolves to its public URL. */
  upload: (file: File) => Promise<string>;
  isDisabled?: boolean;
}

/**
 * Organisation logo picker: shows a preview and uploads the chosen image via the
 * provided `upload` function (which returns the stored URL, e.g. from S3).
 */
export function LogoUpload({ value, onChange, upload, isDisabled }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      toast.danger("Use a PNG, JPG, WebP or SVG image");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.danger("Logo must be 2 MB or smaller");
      return;
    }
    setBusy(true);
    try {
      const url = await upload(file);
      onChange(url);
      toast.success("Logo updated");
    } catch (err) {
      toast.danger((err as { message?: string }).message ?? "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "border-default-200 bg-default-50 grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border",
        )}
      >
        {busy ? (
          <Loader2 className="text-foreground/40 size-5 animate-spin" />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Organisation logo" className="size-full object-contain" />
        ) : (
          <ImageUp className="text-foreground/30 size-7" />
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            isDisabled={isDisabled || busy}
            onPress={() => inputRef.current?.click()}
          >
            <ImageUp className="size-4" /> {value ? "Replace" : "Upload"} logo
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              isDisabled={isDisabled || busy}
              onPress={() => onChange("")}
            >
              <Trash2 className="size-4" /> Remove
            </Button>
          ) : null}
        </div>
        <p className="text-foreground/45 text-xs">PNG, JPG, WebP or SVG · up to 2 MB.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  );
}
