import { doubleDipView } from "@/reviewer-dash/lib/doubleDip";
import { Icon } from "@/reviewer-dash/app/_ui/ui";

// The loud banner for a project that matches another YSWS. Deliberately much
// bigger than a normal Callout: a reviewer has to see this before crediting.
export function DoubleDipBanner({ systemNote }: { systemNote: string | null | undefined }) {
  const view = doubleDipView(systemNote ?? "");
  if (!view) return null;
  return (
    <div className="hc-callout flex items-start gap-4 !p-6" data-tone={view.tone} role="alert">
      <Icon glyph="important" size={44} className="shrink-0" />
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight">{view.title}</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-lg">{view.text}</p>
      </div>
    </div>
  );
}
