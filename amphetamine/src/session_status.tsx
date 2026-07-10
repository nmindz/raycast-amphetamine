import {
  Action,
  ActionPanel,
  Color,
  Icon,
  List,
  open,
  Keyboard,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import {
  endSession,
  getStatus,
  setDisplaySleep,
  startSession,
} from "./amphetamine/osascript";
import {
  getDefaultDisplaySleep,
  getQuickSessionOptions,
} from "./amphetamine/preferences";
import type { AmphetamineStatus, SessionInterval } from "./amphetamine/types";
import {
  describeRemaining,
  describeStartOptions,
  formatBool,
  prettyJson,
} from "./ui/format";
import { showSuccessToast, withToast } from "./ui/toast";

const AUTOMATION_SETTINGS_URL =
  "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation";

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

export default function SessionStatusCommand() {
  const { data, isLoading, error, revalidate } = usePromise(getStatus);

  if (error) {
    return (
      <List isLoading={isLoading} isShowingDetail>
        <List.Item
          title="Amphetamine Unavailable"
          icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
          detail={
            <List.Item.Detail markdown={buildErrorMarkdown(error.message)} />
          }
          actions={
            <ActionPanel>
              <Action
                title="Retry"
                icon={Icon.ArrowClockwise}
                onAction={() => revalidate()}
              />
              <Action.Open
                title="Open Automation Settings"
                icon={Icon.Gear}
                target={AUTOMATION_SETTINGS_URL}
              />
              <Action.CopyToClipboard
                title="Copy Error"
                content={error.message}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} isShowingDetail>
      {data && <SessionItem status={data} onRefresh={revalidate} />}
    </List>
  );
}

function SessionItem({
  status,
  onRefresh,
}: {
  status: AmphetamineStatus;
  onRefresh: () => void;
}) {
  const remaining = describeRemaining(status);
  const active = status.active;

  const start = (options: { duration: number; interval: SessionInterval }) =>
    withToast({
      action: async () => {
        await startSession({
          ...options,
          displaySleepAllowed: getDefaultDisplaySleep(),
        });
        await onRefresh();
      },
      onStart: () => "Starting session",
      onSuccess: () =>
        `Session started · ${describeStartOptions({ ...options, displaySleepAllowed: false })}`,
      onFailure: (err) => ["Failed to start session", err.message],
    });

  const startQuick = withToast({
    action: async () => {
      await startSession(getQuickSessionOptions());
      await onRefresh();
    },
    onStart: () => "Starting session",
    onSuccess: () =>
      `Session started · ${describeStartOptions(getQuickSessionOptions())}`,
    onFailure: (err) => ["Failed to start session", err.message],
  });

  const end = withToast({
    action: async () => {
      await endSession();
      await onRefresh();
    },
    onStart: () => "Ending session",
    onSuccess: () => "Session ended",
    onFailure: (err) => ["Failed to end session", err.message],
  });

  const toggle = active ? end : startQuick;

  const toggleDisplaySleep = withToast({
    action: async () => {
      await setDisplaySleep(!status.displaySleepAllowed);
      await onRefresh();
    },
    onStart: () =>
      status.displaySleepAllowed
        ? "Preventing display sleep"
        : "Allowing display sleep",
    onSuccess: () =>
      status.displaySleepAllowed
        ? "Display sleep prevented"
        : "Display sleep allowed",
    onFailure: (err) => ["Failed to update display sleep", err.message],
  });

  return (
    <List.Item
      title={active ? "Session Active" : "Idle"}
      subtitle={remaining.label}
      icon={
        active
          ? { source: Icon.Bolt, tintColor: Color.Yellow }
          : { source: Icon.BoltDisabled, tintColor: Color.SecondaryText }
      }
      accessories={[
        {
          tag: {
            value: active ? "Active" : "Idle",
            color: active ? Color.Green : Color.SecondaryText,
          },
        },
      ]}
      detail={
        <List.Item.Detail
          markdown={buildStatusMarkdown(status, remaining.label)}
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label
                title="State"
                text={active ? "Active" : "Idle"}
                icon={
                  active
                    ? { source: Icon.Bolt, tintColor: Color.Yellow }
                    : Icon.BoltDisabled
                }
              />
              <List.Item.Detail.Metadata.Label
                title="Time Remaining"
                text={remaining.label}
              />
              <List.Item.Detail.Metadata.Separator />
              <List.Item.Detail.Metadata.Label
                title="Display Sleep"
                text={formatBool(status.displaySleepAllowed)}
              />
              <List.Item.Detail.Metadata.Label
                title="Screen Saver"
                text={formatBool(status.screenSaverAllowed)}
              />
              <List.Item.Detail.Metadata.Label
                title="Closed-Display Mode"
                text={formatBool(status.closedDisplayModeEnabled)}
              />
              <List.Item.Detail.Metadata.Separator />
              <List.Item.Detail.Metadata.Label
                title="Trigger Session"
                text={formatBool(status.triggerSession)}
              />
              <List.Item.Detail.Metadata.Label
                title="Triggers Enabled"
                text={formatBool(status.triggersEnabled)}
              />
              <List.Item.Detail.Metadata.Label
                title="Drive Alive"
                text={formatBool(status.driveAliveEnabled)}
              />
              <List.Item.Detail.Metadata.Separator />
              <List.Item.Detail.Metadata.Label
                title="Amphetamine Version"
                text={status.version}
              />
            </List.Item.Detail.Metadata>
          }
        />
      }
      actions={
        <ActionPanel>
          <Action
            title={active ? "End Session" : "Toggle Session"}
            icon={active ? Icon.Stop : Icon.Play}
            onAction={toggle}
          />
          {!active && (
            <Action
              title="Start Indefinite Session"
              icon={Icon.Bolt}
              onAction={start({ duration: 0, interval: "infinite" })}
            />
          )}
          <ActionPanel.Submenu title="Start Timed Session" icon={Icon.Clock}>
            {TIMED_PRESETS.map((preset) => (
              <Action
                key={preset.title}
                title={preset.title}
                icon={Icon.Clock}
                onAction={start({
                  duration: preset.duration,
                  interval: preset.interval,
                })}
              />
            ))}
          </ActionPanel.Submenu>
          {active && (
            <Action title="End Session" icon={Icon.Stop} onAction={end} />
          )}
          <Action
            title={
              status.displaySleepAllowed
                ? "Prevent Display Sleep"
                : "Allow Display Sleep"
            }
            icon={status.displaySleepAllowed ? Icon.Moon : Icon.Sun}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
            onAction={toggleDisplaySleep}
          />
          <Action
            title="Refresh"
            icon={Icon.ArrowClockwise}
            shortcut={Keyboard.Shortcut.Common.Refresh}
            onAction={async () => {
              await onRefresh();
              await showSuccessToast("Status refreshed");
            }}
          />
          <Action
            title="Open Amphetamine"
            icon={Icon.AppWindow}
            onAction={() => open("/Applications/Amphetamine.app")}
          />
          <Action.CopyToClipboard
            title="Copy Status JSON"
            content={prettyJson(status)}
          />
        </ActionPanel>
      }
    />
  );
}

function buildStatusMarkdown(
  status: AmphetamineStatus,
  remainingLabel: string,
): string {
  const heading = status.active ? "# ⚡ Session Active" : "# 💤 Idle";
  return [
    heading,
    "",
    `**Time remaining:** ${remainingLabel}`,
    "",
    "| Setting | Value |",
    "| --- | --- |",
    `| Display sleep | ${formatBool(status.displaySleepAllowed)} |`,
    `| Screen saver | ${formatBool(status.screenSaverAllowed)} |`,
    `| Closed-display mode | ${formatBool(status.closedDisplayModeEnabled)} |`,
    `| Trigger session | ${formatBool(status.triggerSession)} |`,
    `| Triggers enabled | ${formatBool(status.triggersEnabled)} |`,
    `| Drive Alive | ${formatBool(status.driveAliveEnabled)} |`,
    "",
    `Amphetamine ${status.version}`,
  ].join("\n");
}

function buildErrorMarkdown(message: string): string {
  return [
    "# Amphetamine Unavailable",
    "",
    message,
    "",
    "## Checklist",
    "",
    "- Amphetamine is installed and has been launched at least once.",
    "- Raycast is allowed to control Amphetamine under **System Settings → Privacy & Security → Automation**.",
  ].join("\n");
}
