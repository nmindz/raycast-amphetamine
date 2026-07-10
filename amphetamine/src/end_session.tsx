import { showHUD } from "@raycast/api";
import { endSession, isSessionActive } from "./amphetamine/osascript";
import { showFailureToast } from "./ui/toast";

export default async function Command() {
  try {
    if (!(await isSessionActive())) {
      await showHUD("Amphetamine · No active session");
      return;
    }

    await endSession();
    await showHUD("Amphetamine · Session ended");
  } catch (error) {
    await showFailureToast(error, "Failed to end session");
  }
}
