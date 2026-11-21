import { describe, expect, test } from "bun:test";
import { isJobName, JOBS, JOB_NAMES } from "./registry";

describe("the job registry", () => {
  test("holds exactly the scheduled jobs", () => {
    expect([...JOB_NAMES]).toEqual(["hackatime-sync", "stats-snapshot", "airbridge-preview", "queue-health", "session-cleanup", "rate-limit-cleanup"]);
  });

  test("every job has a description and a run function", () => {
    for (const name of JOB_NAMES) {
      expect(typeof JOBS[name].description).toBe("string");
      expect(JOBS[name].description.trim().length).toBeGreaterThan(0);
      expect(typeof JOBS[name].run).toBe("function");
    }
  });

  test("isJobName admits the registered names and refuses everything else", () => {
    for (const name of JOB_NAMES) expect(isJobName(name)).toBe(true);
    expect(isJobName("")).toBe(false);
    expect(isJobName("hasOwnProperty")).toBe(false);
    expect(isJobName("../registry")).toBe(false);
    expect(isJobName("Hackatime-Sync")).toBe(false);
  });
});
