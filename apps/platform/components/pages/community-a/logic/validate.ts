import { DRAFT_RULES } from "./rules";
import { checkHttpsUrl, checkLength, cleanText, parseHttpsUrl } from "./text";
import type { IdeaTrack, TrackName } from "./types";

// Form validators. Each returns every error at once, keyed by field, so the form can mark all of them.

export const TRACK_LIST: TrackName[] = ["Tools", "Systems", "Compute", "Hardware"];
export const IDEA_TRACKS: IdeaTrack[] = [...TRACK_LIST, "Any"];

export type Validation<Value, Field extends string> = { ok: true; value: Value } | { ok: false; errors: Partial<Record<Field, string>> };

function finish<Value, Field extends string>(errors: Partial<Record<Field, string>>, value: Value): Validation<Value, Field> {
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value };
}

export interface IdeaDraft {
  title: string;
  body: string;
  track: string;
}
export type IdeaField = "title" | "body" | "track";

export function validateIdea(draft: IdeaDraft): Validation<{ title: string; body: string; track: IdeaTrack }, IdeaField> {
  const title = cleanText(draft.title).replace(/\s*\n\s*/g, " ");
  const body = cleanText(draft.body);
  const errors: Partial<Record<IdeaField, string>> = {};
  const titleError = checkLength(title, "Title", { max: DRAFT_RULES.ideaTitleMax });
  if (titleError) errors.title = titleError;
  const bodyError = checkLength(body, "Description", { min: DRAFT_RULES.ideaBodyMin, max: DRAFT_RULES.ideaBodyMax });
  if (bodyError) errors.body = bodyError;
  if (!IDEA_TRACKS.includes(draft.track as IdeaTrack)) errors.track = "Choose a track, or Any track.";
  return finish(errors, { title, body, track: draft.track as IdeaTrack });
}

export interface PostDraft {
  title: string;
  built: string;
  link: string;
  track: string;
  learned: string;
}
export type PostField = "title" | "built" | "link" | "track" | "learned";

export function validatePost(draft: PostDraft): Validation<{ title: string; built: string; link: string; track: TrackName; learned?: string }, PostField> {
  const title = cleanText(draft.title).replace(/\s*\n\s*/g, " ");
  const built = cleanText(draft.built);
  const learned = cleanText(draft.learned);
  const errors: Partial<Record<PostField, string>> = {};
  const titleError = checkLength(title, "Title", { max: DRAFT_RULES.postTitleMax });
  if (titleError) errors.title = titleError;
  const builtError = checkLength(built, "What you built", { min: DRAFT_RULES.postBuiltMin, max: DRAFT_RULES.postBuiltMax });
  if (builtError) errors.built = builtError;
  const linkError = checkHttpsUrl(draft.link, "Link", { required: true, max: DRAFT_RULES.linkMax });
  if (linkError) errors.link = linkError;
  if (!TRACK_LIST.includes(draft.track as TrackName)) errors.track = "Choose a track.";
  if (learned.length > 0) {
    const learnedError = checkLength(learned, "What I learned", { max: DRAFT_RULES.postLearnedMax });
    if (learnedError) errors.learned = learnedError;
  }
  const link = parseHttpsUrl(draft.link, DRAFT_RULES.linkMax) ?? draft.link.trim();
  return finish(errors, { title, built, link, track: draft.track as TrackName, learned: learned.length > 0 ? learned : undefined });
}

export function validateComment(body: string): Validation<string, "body"> {
  const text = cleanText(body);
  const error = checkLength(text, "Comment", { max: DRAFT_RULES.commentMax });
  return error ? { ok: false, errors: { body: error } } : { ok: true, value: text };
}
