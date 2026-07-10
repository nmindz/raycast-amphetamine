export type SessionInterval = "hours" | "minutes" | "infinite";

/** Raw snapshot returned by Amphetamine's read-only AppleScript commands. */
export interface AmphetamineStatus {
  active: boolean;
  /**
   * Result of `session time remaining`, in seconds, with Amphetamine's sentinels:
   * `> 0` seconds left, `0` infinite duration, `-1` Trigger session,
   * `-2` app-based or date-based session, `-3` no active session.
   */
  remainingSeconds: number;
  displaySleepAllowed: boolean;
  screenSaverAllowed: boolean;
  closedDisplayModeEnabled: boolean;
  triggerSession: boolean;
  triggersEnabled: boolean;
  driveAliveEnabled: boolean;
  version: string;
}

export type RemainingKind =
  "finite" | "infinite" | "trigger" | "appOrDate" | "none";

export interface RemainingInfo {
  kind: RemainingKind;
  /** Seconds remaining for a finite session, otherwise `0`. */
  seconds: number;
  /** Human-readable label, e.g. "1h 23m", "Indefinite", "No active session". */
  label: string;
}

export interface StartSessionOptions {
  duration: number;
  interval: SessionInterval;
  displaySleepAllowed: boolean;
}
