import { showHUD } from "@raycast/api";
import {
  endSession,
  isSessionActive,
  startSession,
} from "./amphetamine/osascript";
import { getQuickSessionOptions } from "./amphetamine/preferences";
import { describeStartOptions } from "./ui/format";
import { showFailureToast } from "./ui/toast";

export default async function Command() {
  try {
    if (await isSessionActive()) {
      await endSession();
      await showHUD("Amphetamine · Session ended");
      return;
    }

    const options = getQuickSessionOptions();
    await startSession(options);
    await showHUD(
      `⚡ Amphetamine · Session started (${describeStartOptions(options)})`,
    );
  } catch (error) {
    await showFailureToast(error, "Failed to toggle session");
  }
}
