"use client";

import { PageHeader, PreviewNote, Tabs } from "../../ui/ui";
import "./build.css";
import { Loading } from "./parts";
import { ReviewQueue } from "./review-queue";
import { ScoringGuide } from "./scoring-guide";
import { ShipFeedback } from "./ship-feedback";
import { useReviewsState, useSettleShips, useShips } from "./store";
import { REVIEW_SHIPS } from "./content";

export function ReviewsPage() {
  useSettleShips();
  const [state, , hydrated] = useReviewsState();
  const [ships] = useShips();

  const header = (
    <>
      <PageHeader
        eyebrow="Build"
        title="Reviews"
        lead="Review other builders' ships, and read the anonymous scores and written reasons on your own."
      />
      <PreviewNote>
        The ships you review are made-up samples, and the reviews on your own ships come from sample reviewers you add with the preview tools. Your scores are saved only in this browser. Reviewers are always anonymous.
      </PreviewNote>
    </>
  );

  if (!hydrated) {
    return (
      <>
        {header}
        <Loading />
      </>
    );
  }

  const taken = new Set([...state.done.map((d) => d.shipId), ...state.skipped, ...state.reported]);
  const waiting = REVIEW_SHIPS.filter((s) => !taken.has(s.id)).length;

  return (
    <>
      {header}
      <Tabs
        label="Review sections"
        tabs={[
          { id: "queue", label: "To review", count: waiting, panel: <ReviewQueue /> },
          { id: "feedback", label: "My ship feedback", count: ships.length, panel: <ShipFeedback /> },
          { id: "how", label: "How scoring works", panel: <ScoringGuide /> },
        ]}
      />
    </>
  );
}
