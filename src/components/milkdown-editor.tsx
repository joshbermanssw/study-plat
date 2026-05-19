"use client";

import { Editor, rootCtx, defaultValueCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { history } from "@milkdown/plugin-history";
import { clipboard } from "@milkdown/plugin-clipboard";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { useEffect, useRef } from "react";
import { MilkdownToolbar } from "./milkdown-toolbar";

interface Props {
  initial: string;
  onChange: (markdown: string) => void;
}

function InnerEditor({ initial, onChange }: Props) {
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, initial);
        ctx.get(listenerCtx).markdownUpdated((_ctx, md, prev) => {
          if (md !== prev) onChangeRef.current(md);
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(clipboard)
      .use(listener)
  );

  return <Milkdown />;
}

export function MilkdownEditor(props: Props) {
  return (
    <MilkdownProvider>
      <div className="flex flex-col">
        <MilkdownToolbar />
        <div className="milkdown-host px-6 py-4">
          <InnerEditor {...props} />
        </div>
      </div>
    </MilkdownProvider>
  );
}
