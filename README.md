# raycast-amphetamine

A [Raycast](https://www.raycast.com/) extension for [Amphetamine](https://apps.apple.com/us/app/amphetamine/id937984704), the macOS keep-awake app. Start, end, and toggle sessions, flip every session preference, and watch the countdown from your menu bar — without touching Amphetamine's UI.

Amphetamine ships no CLI, so the extension drives its official AppleScript dictionary through `osascript`.

The extension itself lives in [`amphetamine/`](amphetamine/).

- **[Documentation](amphetamine/README.md)** — commands, preferences, and how the AppleScript bridge works
- **[Installation](amphetamine/INSTALL.md)** — step-by-step setup, Automation permission, troubleshooting

## Quick Start

```bash
cd amphetamine
pnpm install
pnpm run install-local
```

Then restart Raycast and search for **Session Status**.

## License

GNU General Public License v3.0 only — see [LICENSE](LICENSE).
