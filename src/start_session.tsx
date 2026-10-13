import {
  Action,
  ActionPanel,
  Form,
  Icon,
  popToRoot,
  showHUD,
} from "@raycast/api";
import { useState } from "react";
import { startSession } from "./amphetamine/osascript";
import { getDefaultDisplaySleep } from "./amphetamine/preferences";
import type { SessionInterval } from "./amphetamine/types";
import { describeStartOptions } from "./ui/format";
import { showFailureToast } from "./ui/toast";

interface FormValues {
  interval: string;
  amount: string;
  displaySleep: boolean;
}

const MAX_DURATION = 99999;

export default function StartSessionCommand() {
  const [interval, setInterval] = useState<SessionInterval>("infinite");
  const [amountError, setAmountError] = useState<string | undefined>();

  const isTimed = interval !== "infinite";

  async function handleSubmit(values: FormValues) {
    const selected = (values.interval as SessionInterval) ?? "infinite";

    if (selected === "infinite") {
      await submit({
        duration: 0,
        interval: "infinite",
        displaySleepAllowed: values.displaySleep,
      });
      return;
    }

    const amount = Number.parseInt(values.amount, 10);
    if (!Number.isFinite(amount) || amount < 1 || amount > MAX_DURATION) {
      setAmountError(`Enter a whole number between 1 and ${MAX_DURATION}`);
      return;
    }

    await submit({
      duration: amount,
      interval: selected,
      displaySleepAllowed: values.displaySleep,
    });
  }

  async function submit(options: {
    duration: number;
    interval: SessionInterval;
    displaySleepAllowed: boolean;
  }) {
    try {
      await startSession(options);
      await showHUD(
        `⚡ Amphetamine · Session started (${describeStartOptions(options)})`,
      );
      await popToRoot();
    } catch (error) {
      await showFailureToast(error, "Failed to start session");
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Start Session"
            icon={Icon.Bolt}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="interval"
        title="Duration"
        value={interval}
        onChange={(next) => {
          setInterval(next as SessionInterval);
          setAmountError(undefined);
        }}
      >
        <Form.Dropdown.Item
          value="infinite"
          title="Indefinite"
          icon={Icon.Bolt}
        />
        <Form.Dropdown.Item value="minutes" title="Minutes" icon={Icon.Clock} />
        <Form.Dropdown.Item value="hours" title="Hours" icon={Icon.Clock} />
      </Form.Dropdown>

      {isTimed && (
        <Form.TextField
          key={interval}
          id="amount"
          title="Amount"
          placeholder={interval === "minutes" ? "e.g. 30" : "e.g. 2"}
          defaultValue={interval === "minutes" ? "30" : "1"}
          error={amountError}
          onChange={() => setAmountError(undefined)}
          info="How many minutes or hours the session should last."
        />
      )}

      <Form.Checkbox
        id="displaySleep"
        title="Display"
        label="Allow the display to sleep"
        defaultValue={getDefaultDisplaySleep()}
      />

      <Form.Description text="Starting a session ends any existing session, including Trigger-based sessions." />
    </Form>
  );
}
