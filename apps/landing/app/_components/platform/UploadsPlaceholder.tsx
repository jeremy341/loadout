import { ConnectionPlaceholder } from "./ConnectionPlaceholder";

// Shown wherever a builder would add a file (Settings, the project cover). Uploads are not connected: nothing is stored.
export function UploadsPlaceholder({ what = "images and files", reason, button = "Upload a file" }: Readonly<{ what?: string; reason?: string; button?: string }>) {
  return (
    <ConnectionPlaceholder
      name="Uploads"
      status="Not connected"
      reason={reason ?? `Uploads will let you add ${what} here. File storage is not set up yet, so nothing is stored and nothing can be uploaded.`}
    >
      <button type="button" className="pf-btn" disabled>
        {button}
      </button>
    </ConnectionPlaceholder>
  );
}
