"use client";

import { useCallback } from "react";
import type { CmdKey } from "@milkdown/core";
import { callCommand } from "@milkdown/utils";
import { useInstance } from "@milkdown/react";
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleLinkCommand,
  wrapInHeadingCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  insertHrCommand,
  createCodeBlockCommand,
  turnIntoTextCommand,
} from "@milkdown/preset-commonmark";
import { toggleStrikethroughCommand } from "@milkdown/preset-gfm";
import { undoCommand, redoCommand } from "@milkdown/plugin-history";
import {
  Bold, Italic, Strikethrough, Code, Link as LinkIcon,
  List, ListOrdered, Quote, Heading1, Heading2, Heading3, Pilcrow,
  Minus, FileCode, Undo, Redo,
} from "lucide-react";
import { cn } from "@/lib/cn";

export function MilkdownToolbar() {
  // useInstance returns [loading, get]. The get() fn is the live editor.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_loading, get] = useInstance();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const run = useCallback(<T,>(key: CmdKey<T>, payload?: T) => {
    const editor = get();
    if (!editor) return;
    editor.action(callCommand(key, payload));
  }, [get]);

  const onLink = useCallback(() => {
    const url = window.prompt("Link URL");
    if (!url) return;
    run(toggleLinkCommand.key, { href: url });
  }, [run]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5">
      <Group>
        <Btn title="Undo (⌘Z)"   onClick={() => run(undoCommand.key)}><Undo className="size-3.5" /></Btn>
        <Btn title="Redo (⇧⌘Z)"  onClick={() => run(redoCommand.key)}><Redo className="size-3.5" /></Btn>
      </Group>
      <Divider />
      <Group>
        <Btn title="Paragraph"   onClick={() => run(turnIntoTextCommand.key)}><Pilcrow className="size-3.5" /></Btn>
        <Btn title="Heading 1"   onClick={() => run(wrapInHeadingCommand.key, 1)}><Heading1 className="size-3.5" /></Btn>
        <Btn title="Heading 2"   onClick={() => run(wrapInHeadingCommand.key, 2)}><Heading2 className="size-3.5" /></Btn>
        <Btn title="Heading 3"   onClick={() => run(wrapInHeadingCommand.key, 3)}><Heading3 className="size-3.5" /></Btn>
      </Group>
      <Divider />
      <Group>
        <Btn title="Bold (⌘B)"        onClick={() => run(toggleStrongCommand.key)}><Bold className="size-3.5" /></Btn>
        <Btn title="Italic (⌘I)"      onClick={() => run(toggleEmphasisCommand.key)}><Italic className="size-3.5" /></Btn>
        <Btn title="Strikethrough"    onClick={() => run(toggleStrikethroughCommand.key)}><Strikethrough className="size-3.5" /></Btn>
        <Btn title="Inline code"      onClick={() => run(toggleInlineCodeCommand.key)}><Code className="size-3.5" /></Btn>
        <Btn title="Link"             onClick={onLink}><LinkIcon className="size-3.5" /></Btn>
      </Group>
      <Divider />
      <Group>
        <Btn title="Bullet list"      onClick={() => run(wrapInBulletListCommand.key)}><List className="size-3.5" /></Btn>
        <Btn title="Ordered list"     onClick={() => run(wrapInOrderedListCommand.key)}><ListOrdered className="size-3.5" /></Btn>
        <Btn title="Quote"            onClick={() => run(wrapInBlockquoteCommand.key)}><Quote className="size-3.5" /></Btn>
        <Btn title="Code block"       onClick={() => run(createCodeBlockCommand.key)}><FileCode className="size-3.5" /></Btn>
        <Btn title="Divider"          onClick={() => run(insertHrCommand.key)}><Minus className="size-3.5" /></Btn>
      </Group>
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="mx-1 h-4 w-px bg-[var(--color-border)]" />;
}

function Btn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}    // keep editor focus
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded p-1.5 text-[var(--color-muted)]",
        "transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]",
      )}
    >
      {children}
    </button>
  );
}
