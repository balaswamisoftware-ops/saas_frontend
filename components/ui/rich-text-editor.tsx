"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MergeTag {
  tag: string;
  label: string;
}

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** Fields the user can drop into the content as `{{tag}}` placeholders. */
  mergeTags?: MergeTag[];
  "aria-label"?: string;
  className?: string;
}

/** A small toolbar button. */
function TbButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-sm transition-colors",
        active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-default-100",
      )}
    >
      {children}
    </button>
  );
}

/**
 * A TipTap-based rich text editor used to author receipt header/footer markup.
 * Emits clean HTML via `onChange`; supports inserting `{{merge tags}}`.
 */
export function RichTextEditor({
  value,
  onChange,
  mergeTags,
  "aria-label": ariaLabel,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // avoid SSR hydration mismatch in the App Router
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextStyle,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    editorProps: {
      attributes: {
        "aria-label": ariaLabel ?? "Rich text editor",
        class:
          "outline-none min-h-40 px-3 py-2 text-sm [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_hr]:my-2",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep the editor in sync when the external value changes (e.g. switching
  // which layout is being edited, or a reset to defaults).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className={cn("border-default-200 h-52 rounded-lg border", className)} aria-hidden />
    );
  }

  return (
    <div className={cn("border-default-200 overflow-hidden rounded-lg border", className)}>
      <div className="border-default-200 bg-default-50 flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1">
        <TbButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="size-4" />
        </TbButton>
        <TbButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="size-4" />
        </TbButton>
        <TbButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="size-4" />
        </TbButton>

        <span className="bg-default-200 mx-1 h-5 w-px" />

        <TbButton label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="size-4" />
        </TbButton>
        <TbButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="size-4" />
        </TbButton>
        <TbButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="size-4" />
        </TbButton>
        <TbButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="size-4" />
        </TbButton>

        <span className="bg-default-200 mx-1 h-5 w-px" />

        <TbButton label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="size-4" />
        </TbButton>
        <TbButton label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="size-4" />
        </TbButton>
        <TbButton label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="size-4" />
        </TbButton>
        <TbButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="size-4" />
        </TbButton>

        {mergeTags?.length ? (
          <>
            <span className="bg-default-200 mx-1 h-5 w-px" />
            <select
              aria-label="Insert field"
              className="border-default-200 bg-background h-8 rounded-md border px-2 text-xs"
              value=""
              onChange={(e) => {
                const tag = e.target.value;
                if (tag) editor.chain().focus().insertContent(`{{${tag}}}`).run();
                e.currentTarget.value = "";
              }}
            >
              <option value="">Insert field…</option>
              {mergeTags.map((t) => (
                <option key={t.tag} value={t.tag}>
                  {t.label}
                </option>
              ))}
            </select>
          </>
        ) : null}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
