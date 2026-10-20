"use client";

import { PageHeader, PreviewNote } from "../../ui/ui";
import { useCommunityModel } from "./model";
import { ArchivePanel, DifferencesPanel, EraPanel, LogPanel, QuestsPanel, SeasonPanel, StreakPanel } from "./seasons-parts";
import { PreviewToolsPanel } from "./shared";

export function SeasonsPage() {
  const model = useCommunityModel();

  return (
    <>
      <PageHeader eyebrow="Community" title="Seasons" lead="Seasons and Community Eras, with progress toward shared goals." />
      <PreviewNote>
        Season and Era dates, the Era threshold, the community starting total and the quest list are placeholders so the rules can be tested. What you
        log below is saved only in this browser. Nothing is sent to LOADOUT.
      </PreviewNote>

      <div className="pg-stack cb-stack">
        <div className="pg-cols">
          <SeasonPanel model={model} />
          <EraPanel model={model} />
        </div>
        <LogPanel model={model} />
        <QuestsPanel model={model} />
        <StreakPanel model={model} />
        <ArchivePanel model={model} />
        <DifferencesPanel />
        <PreviewToolsPanel />
      </div>
    </>
  );
}
