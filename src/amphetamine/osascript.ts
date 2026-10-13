import { execFile } from "child_process";
import { promisify } from "util";
import type {
  AmphetamineStatus,
  SessionInterval,
  StartSessionOptions,
} from "./types";

const execFileAsync = promisify(execFile);

const OSASCRIPT = "/usr/bin/osascript";
const APP = "Amphetamine";

/** How long to wait before assuming an Apple event will never return. */
const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Runs an AppleScript program, one array entry per physical line, and returns
 * trimmed stdout. Errors are normalized to actionable messages (missing app,
 * missing automation permission, timeout).
 */
async function runOsa(
  lines: string[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  const args: string[] = [];
  for (const line of lines) {
    args.push("-e", line);
  }

  try {
    const { stdout } = await execFileAsync(OSASCRIPT, args, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
    });
    return stdout.trim();
  } catch (error) {
    throw normalizeOsaError(error, timeoutMs);
  }
}

function normalizeOsaError(error: unknown, timeoutMs: number): Error {
  if (!(error instanceof Error)) {
    return new Error(String(error));
  }

  const withStreams = error as Error & {
    code?: string | number | null;
    stderr?: string;
    killed?: boolean;
    signal?: NodeJS.Signals | string | null;
  };

  if (withStreams.code === "ENOENT") {
    return new Error(
      "Could not find osascript. This extension requires macOS.",
    );
  }

  if (
    error.message.toLowerCase().includes("timed out") ||
    (withStreams.killed === true && withStreams.signal === "SIGTERM")
  ) {
    return new Error(
      `Amphetamine did not respond within ${Math.round(timeoutMs / 1000)}s.`,
    );
  }

  const stderr =
    typeof withStreams.stderr === "string" ? withStreams.stderr.trim() : "";
  const haystack = `${stderr}\n${error.message}`;

  if (
    /-1743|not authoriz(ed|ation)|not allowed to send apple events/i.test(
      haystack,
    )
  ) {
    return new Error(
      "Raycast is not authorized to control Amphetamine. Grant access in System Settings → Privacy & Security → Automation → Raycast → Amphetamine, then try again.",
    );
  }

  if (
    /-600|-1728|-10814|-2700|isn.?t running|can.?t get application|application can.?t be found/i.test(
      haystack,
    )
  ) {
    return new Error(
      "Amphetamine is not installed. Install it from the Mac App Store, then try again.",
    );
  }

  return new Error(stderr.length > 0 ? stderr : error.message);
}

function parseBoolean(value: string): boolean {
  return value.trim().toLowerCase() === "true";
}

function tell(command: string): string {
  return `tell application "${APP}" to ${command}`;
}

/**
 * Reads the full status in a single Apple event. Each queried value is emitted
 * on its own line, in a fixed order, then parsed positionally.
 */
export async function getStatus(): Promise<AmphetamineStatus> {
  const stdout = await runOsa([
    `tell application "${APP}"`,
    "  set _active to session is active",
    "  set _remaining to session time remaining",
    "  set _displaySleep to display sleep allowed",
    "  set _screenSaver to screen saver allowed",
    "  set _closedDisplay to closed display mode enabled",
    "  set _trigger to session is Trigger",
    "  set _triggersEnabled to Triggers are enabled",
    "  set _driveAlive to Drive Alive is enabled",
    "  set _ver to version",
    "end tell",
    "set _fields to {_active, _remaining, _displaySleep, _screenSaver, _closedDisplay, _trigger, _triggersEnabled, _driveAlive, _ver}",
    'set _text to ""',
    "repeat with _f in _fields",
    "  set _text to _text & (_f as text) & linefeed",
    "end repeat",
    "return _text",
  ]);

  const parts = stdout.split(/\r?\n/).map((line) => line.trim());
  if (parts.length < 9) {
    throw new Error("Received an unexpected status response from Amphetamine.");
  }

  return {
    active: parseBoolean(parts[0]),
    remainingSeconds: Number.parseInt(parts[1], 10) || 0,
    displaySleepAllowed: parseBoolean(parts[2]),
    screenSaverAllowed: parseBoolean(parts[3]),
    closedDisplayModeEnabled: parseBoolean(parts[4]),
    triggerSession: parseBoolean(parts[5]),
    triggersEnabled: parseBoolean(parts[6]),
    driveAliveEnabled: parseBoolean(parts[7]),
    version: parts[8],
  };
}

export async function isSessionActive(): Promise<boolean> {
  return parseBoolean(await runOsa([tell("session is active")]));
}

/**
 * Starts a new session. Values come from our own dropdowns, but duration and
 * interval are still coerced so nothing untrusted reaches the AppleScript
 * record literal.
 */
export async function startSession(
  options: StartSessionOptions,
): Promise<void> {
  const displaySleep = options.displaySleepAllowed ? "true" : "false";

  let record: string;
  if (options.interval === "infinite") {
    // Per Amphetamine's dictionary: duration 0 + interval 0 means indefinite.
    record = `{duration:0, interval:0, displaySleepAllowed:${displaySleep}}`;
  } else {
    const unit: SessionInterval =
      options.interval === "minutes" ? "minutes" : "hours";
    const duration = Math.min(
      99999,
      Math.max(1, Math.floor(Number(options.duration) || 0)),
    );
    record = `{duration:${duration}, interval:${unit}, displaySleepAllowed:${displaySleep}}`;
  }

  await runOsa([tell(`start new session with options ${record}`)]);
}

export async function endSession(): Promise<void> {
  await runOsa([tell("end session")]);
}

export async function setDisplaySleep(allow: boolean): Promise<void> {
  await runOsa([tell(allow ? "allow display sleep" : "prevent display sleep")]);
}

export async function setScreenSaver(allow: boolean): Promise<void> {
  await runOsa([tell(allow ? "allow screen saver" : "prevent screen saver")]);
}

export async function setClosedDisplayMode(enable: boolean): Promise<void> {
  await runOsa([
    tell(enable ? "enable closed display mode" : "disable closed display mode"),
  ]);
}

export async function setTriggers(enable: boolean): Promise<void> {
  await runOsa([tell(enable ? "enable Triggers" : "disable Triggers")]);
}

export async function setDriveAlive(enable: boolean): Promise<void> {
  await runOsa([tell(enable ? "enable Drive Alive" : "disable Drive Alive")]);
}
