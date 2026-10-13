import type {
  AmphetamineStatus,
  RemainingInfo,
  StartSessionOptions,
} from "../amphetamine/types";

export function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function formatBool(value: boolean): string {
  return value ? "Yes" : "No";
}

/** "1h 23m 45s", "12m 03s", "45s" — always renders at least one unit. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (hours > 0 || minutes > 0) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${secs}s`);
  return parts.join(" ");
}

/** Maps Amphetamine's `session time remaining` sentinels to a friendly label. */
export function describeRemaining(status: AmphetamineStatus): RemainingInfo {
  if (!status.active) {
    return { kind: "none", seconds: 0, label: "No active session" };
  }

  const remaining = status.remainingSeconds;
  if (remaining === 0) {
    return { kind: "infinite", seconds: 0, label: "Indefinite" };
  }
  if (remaining === -1) {
    return { kind: "trigger", seconds: 0, label: "Trigger session" };
  }
  if (remaining === -2) {
    return {
      kind: "appOrDate",
      seconds: 0,
      label: "Until app quits or set time",
    };
  }
  if (remaining < 0) {
    return { kind: "none", seconds: 0, label: "No active session" };
  }
  return {
    kind: "finite",
    seconds: remaining,
    label: formatDuration(remaining),
  };
}

/** Compact label for the menu-bar title, e.g. "∞", "1:23", "12m". */
export function shortRemaining(info: RemainingInfo): string {
  switch (info.kind) {
    case "infinite":
      return "∞";
    case "trigger":
      return "Trigger";
    case "appOrDate":
      return "Timed";
    case "none":
      return "";
    case "finite": {
      const hours = Math.floor(info.seconds / 3600);
      const minutes = Math.floor((info.seconds % 3600) / 60);
      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}`;
      }
      if (minutes > 0) {
        return `${minutes}m`;
      }
      return `${info.seconds}s`;
    }
  }
}

/** Human label for a start request, e.g. "Indefinite", "30 Minutes", "2 Hours". */
export function describeStartOptions(options: StartSessionOptions): string {
  if (options.interval === "infinite") {
    return "Indefinite";
  }
  const unit = options.interval === "minutes" ? "Minute" : "Hour";
  return `${options.duration} ${unit}${options.duration === 1 ? "" : "s"}`;
}
