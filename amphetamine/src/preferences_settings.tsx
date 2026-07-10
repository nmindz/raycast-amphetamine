import { Action, ActionPanel, Color, Icon, List, Keyboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import {
  getStatus,
  setClosedDisplayMode,
  setDisplaySleep,
  setDriveAlive,
  setScreenSaver,
  setTriggers,
} from "./amphetamine/osascript";
import type { AmphetamineStatus } from "./amphetamine/types";
import { prettyJson } from "./ui/format";
import { showSuccessToast, withToast } from "./ui/toast";

interface ToggleDef {
  key: string;
  title: string;
  read: (status: AmphetamineStatus) => boolean;
  write: (enabled: boolean) => Promise<void>;
  onLabel: string;
  offLabel: string;
  note: string;
}

const TOGGLES: ToggleDef[] = [
  {
    key: "displaySleep",
    title: "Display Sleep",
    read: (s) => s.displaySleepAllowed,
    write: setDisplaySleep,
    onLabel: "Allowed",
    offLabel: "Prevented",
    note: "Applies to the active session if one is running, otherwise sets the global default for new sessions.",
  },
  {
    key: "screenSaver",
    title: "Screen Saver",
    read: (s) => s.screenSaverAllowed,
    write: setScreenSaver,
    onLabel: "Allowed",
    offLabel: "Prevented",
    note: "Allowing the screen saver may prompt for a delay and is not recommended while the Mac is unattended.",
  },
  {
    key: "closedDisplay",
    title: "Closed-Display Mode",
    read: (s) => s.closedDisplayModeEnabled,
    write: setClosedDisplayMode,
    onLabel: "Enabled",
    offLabel: "Disabled",
    note: "Lets the system stay awake with the lid closed. Amphetamine may show a one-time warning the first time this is enabled.",
  },
  {
    key: "triggers",
    title: "Triggers",
    read: (s) => s.triggersEnabled,
    write: setTriggers,
    onLabel: "Enabled",
    offLabel: "Disabled",
    note: "Controls whether Amphetamine automatically starts sessions from your configured Triggers.",
  },
  {
    key: "driveAlive",
    title: "Drive Alive",
    read: (s) => s.driveAliveEnabled,
    write: setDriveAlive,
    onLabel: "Enabled",
    offLabel: "Disabled",
    note: "Keeps configured external drives from spinning down.",
  },
];

export default function PreferencesSettingsCommand() {
  const { data, isLoading, error, revalidate } = usePromise(getStatus);

  if (error) {
    return (
      <List isLoading={isLoading}>
        <List.EmptyView
          icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
          title="Failed to Load Preferences"
          description={error.message}
          actions={
            <ActionPanel>
              <Action
                title="Retry"
                icon={Icon.ArrowClockwise}
                onAction={() => revalidate()}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      searchBarPlaceholder="Filter preferences"
    >
      {data &&
        TOGGLES.map((toggle) => (
          <ToggleItem
            key={toggle.key}
            toggle={toggle}
            status={data}
            onRefresh={revalidate}
          />
        ))}
    </List>
  );
}

function ToggleItem({
  toggle,
  status,
  onRefresh,
}: {
  toggle: ToggleDef;
  status: AmphetamineStatus;
  onRefresh: () => void;
}) {
  const enabled = toggle.read(status);
  const stateLabel = enabled ? toggle.onLabel : toggle.offLabel;

  const toggleAction = withToast({
    action: async () => {
      await toggle.write(!enabled);
      await onRefresh();
    },
    onStart: () => `Updating ${toggle.title}`,
    onSuccess: () =>
      `${toggle.title}: ${enabled ? toggle.offLabel : toggle.onLabel}`,
    onFailure: (error) => [`Failed to update ${toggle.title}`, error.message],
  });

  return (
    <List.Item
      title={toggle.title}
      icon={
        enabled
          ? { source: Icon.CheckCircle, tintColor: Color.Green }
          : Icon.Circle
      }
      accessories={[
        {
          tag: {
            value: stateLabel,
            color: enabled ? Color.Green : Color.SecondaryText,
          },
        },
      ]}
      detail={
        <List.Item.Detail
          markdown={`# ${toggle.title}\n\n**Current:** ${stateLabel}\n\n${toggle.note}`}
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label
                title="Setting"
                text={toggle.title}
              />
              <List.Item.Detail.Metadata.Label
                title="State"
                text={stateLabel}
              />
            </List.Item.Detail.Metadata>
          }
        />
      }
      actions={
        <ActionPanel>
          <Action
            title={enabled ? `Set ${toggle.offLabel}` : `Set ${toggle.onLabel}`}
            icon={enabled ? Icon.XMarkCircle : Icon.CheckCircle}
            onAction={toggleAction}
          />
          <Action
            title="Refresh"
            icon={Icon.ArrowClockwise}
            shortcut={Keyboard.Shortcut.Common.Refresh}
            onAction={async () => {
              await onRefresh();
              await showSuccessToast("Preferences refreshed");
            }}
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
