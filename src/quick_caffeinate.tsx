import { showHUD } from "@raycast/api";
import { startSession } from "./amphetamine/osascript";
import { getQuickSessionOptions } from "./amphetamine/preferences";
import { describeStartOptions } from "./ui/format";
import { showFailureToast } from "./ui/toast";

export default async function Command() {
  const options = getQuickSessionOptions();

  try {
    await startSession(options);
    await showHUD(
      `⚡ Amphetamine · Session started (${describeStartOptions(options)})`,
    );
  } catch (error) {
    await showFailureToast(error, "Failed to start session");
  }
}
