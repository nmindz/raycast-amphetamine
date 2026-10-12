# Amphetamine for Raycast

Control [Amphetamine](https://apps.apple.com/us/app/amphetamine/id937984704) keep-awake sessions and preferences directly from Raycast — start, end, and toggle sessions, flip every session flag, and watch the countdown from your menu bar.

Amphetamine ships no CLI, so this extension drives Amphetamine's official AppleScript dictionary through `/usr/bin/osascript`. No extra binaries, no private state, no polling of undocumented internals.

> **New here?** Follow [INSTALL.md](INSTALL.md) for the full step-by-step setup, including the macOS Automation permission that every command depends on.

## Install in 30 Seconds

```bash
git clone git@github.com:nmindz/raycast-amphetamine.git
cd raycast-amphetamine
make install
```

Then search Raycast for **Session Status**. The first command run triggers a one-time macOS prompt: _"Raycast" wants to control "Amphetamine"_ — click **OK**.

`make install` installs dependencies with pnpm when needed, then registers the extension with every Raycast app on this Mac: a short `ray develop` session for Raycast 2 and Raycast Beta, a build into `~/.config/raycast/extensions/amphetamine/` plus a restart for Raycast 1. No Raycast account and no long-running dev server required. [INSTALL.md](INSTALL.md) has the full walkthrough.

## Commands

| Command                 | Mode     | What it does                                                                                                                                                                                                             |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Session Status**      | view     | Dashboard for the current session — active/idle, time remaining, and every session and preference flag. Actions: toggle, start indefinite, start a timed preset, allow/prevent display sleep, refresh, copy status JSON. |
| **Start Session**       | view     | Form to start a session for a custom number of minutes or hours, or indefinitely, with an optional display-sleep override.                                                                                               |
| **Start Quick Session** | no-view  | One-shot start using the configured **Quick Session Duration**. Ideal for a hotkey.                                                                                                                                      |
| **End Session**         | no-view  | Ends the current session. Reports cleanly when nothing is running instead of erroring.                                                                                                                                   |
| **Toggle Session**      | no-view  | Ends the active session, or starts the quick session when idle. The best single hotkey to bind.                                                                                                                          |
| **Manage Preferences**  | view     | Toggle Display Sleep, Screen Saver, Closed-Display Mode, Triggers, and Drive Alive, each with an explanation of what it affects.                                                                                         |
| **Menu Bar**            | menu-bar | Live session status in the menu bar, refreshed every minute, with start/end/timed-preset actions.                                                                                                                        |

## Extension Preferences

Configure via Raycast → **Extensions** → **Amphetamine**, or the _Configure Quick Session…_ item in the menu bar.

| Preference                 | Default    | Effect                                                                                                                                                                                                                                        |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Quick Session Duration** | Indefinite | Duration used by _Start Quick Session_, _Toggle Session_, the menu bar quick action, and _Session Status_'s primary toggle when idle. Choices: Indefinite, 15m, 30m, 1h, 2h, 4h, 8h.                                                          |
| **Display Sleep**          | Off        | Applied to every session this extension starts without an explicit checkbox — quick, toggle, and _Session Status_'s indefinite and timed presets. In the _Start Session_ form it only seeds the checkbox, so you can override it per session. |

## Automation Permission

macOS gates AppleScript control on a per-app-pair basis. The **first** time any command runs, macOS asks:

> "Raycast" wants to control "Amphetamine".

Click **OK**. If the prompt was dismissed or denied, re-enable it under **System Settings → Privacy & Security → Automation → Raycast → Amphetamine**.

Until permission is granted, every command reports a clear, actionable error rather than failing silently — the extension detects Apple event `-1743` and tells you exactly which settings pane to open.

## Time-Remaining Semantics

Amphetamine's `session time remaining` overloads its return value with sentinels. _Session Status_ and the menu bar translate them:

| Raw value | Displayed as                                            |
| --------- | ------------------------------------------------------- |
| `> 0`     | Seconds left, formatted `1h 23m 45s` (menu bar: `1:23`) |
| `0`       | `Indefinite` (menu bar: `∞`)                            |
| `-1`      | `Trigger session`                                       |
| `-2`      | `Until app quits or set time`                           |
| `-3`      | `No active session`                                     |

## Requirements

- macOS
- [Amphetamine](https://apps.apple.com/us/app/amphetamine/id937984704) 5+, installed at `/Applications/Amphetamine.app` and launched at least once
- Raycast
- Node.js 22+ and pnpm (for building from source)

## Development

```bash
pnpm install
pnpm run install-local    # register with every Raycast app (what `make install` runs)
pnpm run uninstall-local  # remove from every Raycast extensions folder
pnpm run build            # compile + regenerate raycast-env.d.ts; does NOT install
pnpm run dev              # hot-reload dev mode; needs `ray login` first
```

`pnpm run dev` is only for iterating on the code, and it requires a Raycast account — without one it compiles, prints `ready`, and registers nothing without erroring. Plain installs should use `install-local`.

`pnpm exec tsc --noEmit` type-checks without emitting.

> **`pnpm run lint` fails by design.** Raycast's manifest schema pins `license` to the constant `"MIT"`, so `ray lint` rejects this extension's GPL-3.0 license with `9:13 error must be equal to constant`. Nothing else in the toolchain enforces it — `ray build` and `ray develop` both succeed. To lint without the manifest check:
>
> ```bash
> pnpm exec eslint src        # code correctness
> pnpm exec prettier --check src   # formatting
> pnpm exec tsc --noEmit      # types
> ```

### Project Layout

```
src/
  amphetamine/
    osascript.ts    AppleScript bridge — every Apple event and error normalization
    preferences.ts  Maps the duration preference onto concrete start options
    types.ts        AmphetamineStatus, RemainingInfo, StartSessionOptions
  ui/
    format.ts       Duration formatting and sentinel interpretation
    toast.ts        Toast helpers, including the withToast async wrapper
  *.tsx             One file per command, named to match package.json
scripts/
  make-icon.py      Regenerates assets/extension-icon.png
```

`getStatus()` reads all nine status fields in a **single** Apple event and parses them positionally, so the menu bar's per-minute refresh costs one round trip rather than nine.

### Icon

`assets/extension-icon.png` is generated by `scripts/make-icon.py` (requires Pillow):

```bash
python3 scripts/make-icon.py
```

The artwork is original — a gradient tile with an energy bolt — and deliberately does not reuse Amphetamine.app's copyrighted icon.

## Publishing Notes

The Raycast Store requires extensions to be MIT-licensed. This extension is GPL-3.0, so it is **not** eligible for the Store as licensed — it is meant to be built and installed from source per [INSTALL.md](INSTALL.md).

If you ever do relicense for Store submission, two other things need fixing first: the Store expects an npm `package-lock.json` (this project uses pnpm), and `author` in `package.json` must be your Raycast username.

## License

GNU General Public License v3.0 only — see [LICENSE](../LICENSE).

This program is free software: you can redistribute it and/or modify it under the terms of version 3 of the GNU General Public License as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
