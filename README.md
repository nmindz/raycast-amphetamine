# raycast-amphetamine

A [Raycast](https://www.raycast.com/) extension for [Amphetamine](https://apps.apple.com/us/app/amphetamine/id937984704), the macOS keep-awake app. Start, end, and toggle sessions, flip every session preference, and watch the countdown from your menu bar — without touching Amphetamine's UI.

Amphetamine ships no CLI, so the extension drives its official AppleScript dictionary through `osascript`.

The extension itself lives in [`amphetamine/`](amphetamine/).

- **[Documentation](amphetamine/README.md)** — commands, preferences, and how the AppleScript bridge works
- **[Installation](amphetamine/INSTALL.md)** — step-by-step setup, Automation permission, troubleshooting

## Quick Start

```bash
make install
```

Registers the extension with every Raycast app on this Mac (Raycast 2, Raycast 1, Raycast Beta), then search for **Session Status**. `make uninstall` removes it.

## License

GNU General Public License v3.0 only — see [LICENSE](LICENSE).
