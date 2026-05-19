import { AppShell } from "@/components/app-shell";
import { SyncPicker, type SyncItem } from "./sync-picker";
import { flattenNotesForSearch, getAllUnits } from "@/lib/content";

export const dynamic = "force-dynamic";   // always read fresh disk state

export default function SyncPage() {
  const units = getAllUnits();
  const searchIndex = flattenNotesForSearch();

  const items: SyncItem[] = [];
  for (const u of units) {
    for (const n of u.allNotes) {
      if (!n.canvasUrl) continue;
      if (n.canvasItemType && n.canvasItemType !== "File") continue; // only File items are downloadable
      items.push({
        unit: n.unit,
        unitName: u.name,
        unitColor: u.color,
        slug: n.slug,
        title: n.title,
        week: n.week,
        module: n.module,
        type: n.type,
        downloaded: !!n.localFile,
        hasExtract: n.body.includes("{/* canvas-extract-start */}"),
        localFile: n.localFile,
        fileSize: n.fileSize,
        fetchedAt: n.fetchedAt,
      });
    }
  }

  return (
    <AppShell searchIndex={searchIndex}>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <header className="mb-6 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Source files</h1>
          <p className="max-w-2xl text-sm text-[var(--color-muted)]">
            Tick the Canvas items you want as local PDFs, then click <em>Download selected</em>.
            Each download walks Canvas&apos;s module-item → file API (bulk <code>/files</code> 403s for students),
            saves to <code className="font-mono text-xs">data/sources/&lt;UNIT&gt;/</code>,
            and stamps <code className="font-mono text-xs">localFile</code> into the stub&apos;s frontmatter
            so Claude can read it in Note Sessions.
          </p>
        </header>

        <SyncPicker items={items} />
      </div>
    </AppShell>
  );
}
