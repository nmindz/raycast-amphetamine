import {
  Color,
  Icon,
  MenuBarExtra,
  open,
  openCommandPreferences,
  Keyboard,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { endSession, getStatus, startSession } from "./amphetamine/osascript";
import { getQuickSessionOptions } from "./amphetamine/preferences";
import type { SessionInterval } from "./amphetamine/types";
import {
  describeRemaining,
  describeStartOptions,
  formatBool,
  shortRemaining,
} from "./ui/format";
import { showFailureToast, showSuccessToast } from "./ui/toast";

const TIMED_PRESETS: {
  title: string;
  duration: number;
  interval: SessionInterval;
}[] = [
  { title: "15 Minutes", duration: 15, interval: "minutes" },
  { title: "30 Minutes", duration: 30, interval: "minutes" },
  { title: "1 Hour", duration: 1, interval: "hours" },
  { title: "2 Hours", duration: 2, interval: "hours" },
  { title: "4 Hours", duration: 4, interval: "hours" },
  { title: "8 Hours", duration: 8, interval: "hours" },
];

export default function MenuBarCommand() {
  const { data, isLoading, error, revalidate } = useCachedPromise(getStatus);

  const active = data?.active ?? false;
  const remaining = data ? describeRemaining(data) : undefined;

  const icon = active
    ? { source: Icon.Bolt, tintColor: Color.Yellow }
    : { source: Icon.BoltDisabled, tintColor: Color.SecondaryText };

  async function run(label: string, action: () => Promise<void>) {
    try {
      await action();
      await revalidate();
      await showSuccessToast(label);
    } catch (err) {
      await showFailureToast(err, "Amphetamine action failed");
    }
  }

  if (error) {
    return (
      <MenuBarExtra
        icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
        tooltip="Amphetamine unavailable"
      >
        <MenuBarExtra.Item
          title="Amphetamine Unavailable"
          subtitle={error.message}
        />
        <MenuBarExtra.Item
          title="Retry"
          icon={Icon.ArrowClockwise}
          onAction={() => revalidate()}
        />
      </MenuBarExtra>
    );
  }

  return (
    <MenuBarExtra
      icon={icon}
      isLoading={isLoading}
      title={active ? shortRemaining(remaining!) : undefined}
      tooltip={
        active ? `Amphetamine · ${remaining?.label}` : "Amphetamine · Idle"
      }
    >
      <MenuBarExtra.Section
        title={active ? `Active · ${remaining?.label}` : "Idle"}
      >
        {active ? (
          <MenuBarExtra.Item
            title="End Session"
            icon={Icon.Stop}
            onAction={() => run("Session ended", endSession)}
          />
        ) : (
          <MenuBarExtra.Item
            title={`Start Session (${describeStartOptions(getQuickSessionOptions())})`}
            icon={Icon.Bolt}
            onAction={() =>
              run("Session started", () =>
                startSession(getQuickSessionOptions()),
              )
            }
          />
        )}
        <MenuBarExtra.Submenu title="Start Timed Session" icon={Icon.Clock}>
          {TIMED_PRESETS.map((preset) => (
            <MenuBarExtra.Item
              key={preset.title}
              title={preset.title}
              onAction={() =>
                run(`Session started · ${preset.title}`, () =>
                  startSession({
                    duration: preset.duration,
                    interval: preset.interval,
                    displaySleepAllowed:
                      getQuickSessionOptions().displaySleepAllowed,
                  }),
                )
              }
            />
          ))}
          <MenuBarExtra.Item
            title="Indefinite"
            icon={Icon.Bolt}
            onAction={() =>
              run("Session started · Indefinite", () =>
                startSession({
                  duration: 0,
                  interval: "infinite",
                  displaySleepAllowed:
                    getQuickSessionOptions().displaySleepAllowed,
                }),
              )
            }
          />
        </MenuBarExtra.Submenu>
      </MenuBarExtra.Section>

      {data && (
        <MenuBarExtra.Section title="Status">
          <MenuBarExtra.Item
            title={`Display Sleep: ${formatBool(data.displaySleepAllowed)}`}
            icon={Icon.Moon}
          />
          <MenuBarExtra.Item
            title={`Screen Saver: ${formatBool(data.screenSaverAllowed)}`}
            icon={Icon.Desktop}
          />
          <MenuBarExtra.Item
            title={`Closed-Display Mode: ${formatBool(data.closedDisplayModeEnabled)}`}
            icon={Icon.Window}
          />
          <MenuBarExtra.Item
            title={`Triggers: ${formatBool(data.triggersEnabled)}`}
            icon={Icon.Wand}
          />
          <MenuBarExtra.Item
            title={`Drive Alive: ${formatBool(data.driveAliveEnabled)}`}
            icon={Icon.HardDrive}
          />
        </MenuBarExtra.Section>
      )}

      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Open Amphetamine"
          icon={Icon.AppWindow}
          onAction={() => open("/Applications/Amphetamine.app")}
        />
        <MenuBarExtra.Item
          title="Configure Quick Session…"
          icon={Icon.Gear}
          onAction={() => openCommandPreferences()}
        />
        <MenuBarExtra.Item
          title="Refresh"
          icon={Icon.ArrowClockwise}
          shortcut={Keyboard.Shortcut.Common.Refresh}
          onAction={() => revalidate()}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
