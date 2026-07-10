# Install — Amphetamine Raycast Extension

Not on Raycast Store. Install = build a dist bundle into Raycast's local extensions folder:

```
~/.config/raycast/extensions/amphetamine/
```

Raycast scans that folder at launch. Store extensions sit there under UUID names; locally-built ones use the extension's `name`. No Raycast account, no login, no dev server, no sideloading hack.

Time: ~2 min.

## 1. Prerequisites

| Need           | Check                              | Missing →                                                                                    |
| -------------- | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| macOS          | —                                  | macOS-only. Drives AppleScript.                                                              |
| Amphetamine 5+ | `ls /Applications/Amphetamine.app` | [Mac App Store](https://apps.apple.com/us/app/amphetamine/id937984704), then **launch once** |
| Raycast        | open Raycast                       | [raycast.com](https://www.raycast.com/)                                                      |
| Node.js 22+    | `node --version`                   | `brew install node`                                                                          |
| pnpm           | `pnpm --version`                   | `corepack enable pnpm`                                                                       |

**Launch Amphetamine once — mandatory.** Never-launched → macOS cannot resolve `tell application "Amphetamine"` → every command fails "Amphetamine is not installed."

## 2. Clone

```bash
git clone git@github.com:nmindz/raycast-amphetamine.git
cd raycast-amphetamine/amphetamine
```

Extension lives in `amphetamine/`. Run all commands below from there.

## 3. Deps

```bash
pnpm install
```

pnpm runs esbuild's install script — already allow-listed in `pnpm-workspace.yaml`. Hits `ERR_PNPM_IGNORED_BUILDS` → `pnpm approve-builds`, allow `esbuild`.

## 4. Install

```bash
pnpm run install-local
```

Wraps `ray build -e dist -o "$HOME/.config/raycast/extensions/amphetamine"`. Compiles, type-checks, writes 7 command bundles + `assets/` + `package.json` into the extensions folder.

Success ends with:

```
ready  - built extension successfully
```

## 5. Restart Raycast

Raycast indexes the extensions folder at launch. Quit and reopen — new commands appear.

## 6. Verify

Open Raycast, type `Session Status`. Appears under **Amphetamine**. 7 commands live: Session Status, Start Session, Start Quick Session, End Session, Toggle Session, Manage Preferences, Menu Bar.

## 7. Grant Automation permission

Run **Session Status** once. macOS prompts:

> "Raycast" wants to control "Amphetamine".

Click **OK**.

Missed or denied → extension reports explicit error, never fails silently. Re-enable at **System Settings → Privacy & Security → Automation → Raycast → Amphetamine**.

Newly granted permission not taking effect → quit + reopen Raycast.

## 8. Recommended setup

- **Hotkey on _Toggle Session_** — starts quick session when idle, ends active one otherwise. Best single binding. Raycast → search command → `⌘K` → **Configure Command** → set hotkey.
- **Menu Bar command** — always-visible countdown. Refreshes every 1 min.
- **Quick Session Duration** — Raycast → **Extensions** → **Amphetamine**. Defaults to Indefinite.

## Update

```bash
cd raycast-amphetamine
git pull
cd amphetamine
pnpm install
pnpm run install-local
```

Restart Raycast to pick up the new build.

## Uninstall

```bash
rm -rf ~/.config/raycast/extensions/amphetamine
```

Restart Raycast. Automation permission revokes separately: **System Settings → Privacy & Security → Automation → Raycast → Amphetamine**.

## Develop (optional)

```bash
pnpm run dev
```

`ray develop` = hot reload + `console.log` streamed to terminal. **Requires a Raycast account**: run `pnpm exec ray login` first. Without it, dev mode compiles, prints `ready`, and registers nothing — no error. Verify auth with `pnpm exec ray profile`.

Dev mode is for iterating on the code. To just install and use the extension, step 4 needs no account.

## Troubleshooting

| Symptom                                                                            | Cause                                                                                                           | Fix                                                                                                 |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Commands absent after install                                                      | Raycast indexes at launch.                                                                                      | Quit + reopen Raycast. Then `ls ~/.config/raycast/extensions/amphetamine` — 7 `.js` files expected. |
| `pnpm run dev` prints `ready`, nothing appears                                     | Raycast CLI not logged in. Dev mode compiles, then silently skips registration.                                 | Use `pnpm run install-local` instead, or `pnpm exec ray login`.                                     |
| "Raycast is not authorized to control Amphetamine."                                | Apple event `-1743`. Permission missing/denied.                                                                 | Step 7. Toggle already on → off, on, restart Raycast.                                               |
| "Amphetamine is not installed. Install it from the Mac App Store, then try again." | App absent, or installed but never launched.                                                                    | Open `/Applications/Amphetamine.app` once, retry.                                                   |
| "Amphetamine did not respond within 15s."                                          | Apple event timeout — modal dialog in Amphetamine awaiting input (e.g. Closed-Display Mode's one-time warning). | Front Amphetamine, dismiss dialog, retry.                                                           |
| "Received an unexpected status response from Amphetamine."                         | Dictionary returned <9 fields → Amphetamine older than 5.                                                       | Update Amphetamine.                                                                                 |
| `ERR_PNPM_IGNORED_BUILDS: esbuild`                                                 | pnpm blocked esbuild postinstall → no bundler.                                                                  | `pnpm approve-builds`, allow `esbuild`, `pnpm install`.                                             |
| `pnpm run lint` fails: `9:13 error must be equal to constant`                      | Raycast manifest schema pins `license` to `"MIT"`; this extension is GPL-3.0.                                   | Expected. Use `pnpm exec eslint src`, `pnpm exec prettier --check src`, `pnpm exec tsc --noEmit`.   |
| Menu bar countdown stale                                                           | 1-min refresh interval.                                                                                         | Menu bar **Refresh** (`⌘R`).                                                                        |
