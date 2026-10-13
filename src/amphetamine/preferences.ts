import { getPreferenceValues } from "@raycast/api";
import type { SessionInterval, StartSessionOptions } from "./types";

interface ExtensionPreferences {
  quickDuration: string;
  defaultDisplaySleep: boolean;
}

const DURATION_MAP: Record<
  string,
  { duration: number; interval: SessionInterval }
> = {
  infinite: { duration: 0, interval: "infinite" },
  "15m": { duration: 15, interval: "minutes" },
  "30m": { duration: 30, interval: "minutes" },
  "1h": { duration: 1, interval: "hours" },
  "2h": { duration: 2, interval: "hours" },
  "4h": { duration: 4, interval: "hours" },
  "8h": { duration: 8, interval: "hours" },
};

/** Resolves the configured quick-session preset into concrete start options. */
export function getQuickSessionOptions(): StartSessionOptions {
  const prefs = getPreferenceValues<ExtensionPreferences>();
  const mapped = DURATION_MAP[prefs.quickDuration] ?? DURATION_MAP.infinite;
  return { ...mapped, displaySleepAllowed: Boolean(prefs.defaultDisplaySleep) };
}

/** The configured default for "allow display sleep" on quick/manual starts. */
export function getDefaultDisplaySleep(): boolean {
  return Boolean(
    getPreferenceValues<ExtensionPreferences>().defaultDisplaySleep,
  );
}
