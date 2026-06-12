# Nioh 2 Save Editor

A Node.js + TypeScript Electron desktop app for editing Nioh 2 save files (PC Steam and PS4).

## Features

- **Stats** – Edit Amrita, Gold, Level, all attributes, and weapon proficiencies
- **Weapons** – Browse, filter, edit (ID, level, tier, familiarity, 7 effect slots), delete
- **Items** – Browse, filter, edit (ID, quantity, refashion), max-out all, delete
- **Scrolls** – Browse, filter, edit (level, tier, 7 effect slots), delete
- **Import** – Merge character data from another save into your current file
- **PC & PS4** – Supports `SAVEDATA.BIN` (Steam) and `APP.BIN` (PS4 decrypted/raw)
- **Cross-platform** – PC encryption/decryption runs natively on macOS, Linux, and Windows (no external tools required)

## Setup

```bash
pnpm install
```

### Encryption / Decryption

**PC saves (`SAVEDATA.BIN`)** are handled entirely in TypeScript — no external tools required on any platform. The implementation is a port of [pawREP/Nioh-Savedata-Decryption-Tool](https://github.com/pawREP/Nioh-Savedata-Decryption-Tool) (MIT licensed): AES-128 with a custom non-invertible SBox in CTR mode, where the same operation both encrypts and decrypts.

**PS4 saves (`APP.BIN`)** come in two forms:

| File type | Magic bytes | Handling |
|---|---|---|
| Save Wizard exported (decrypted) | `00 00 00 00` | ✅ Cross-platform, no tools needed |
| Raw PS4-encrypted | other | ⚠️ Requires `ps4.exe` (Windows only) |

For PS4-encrypted saves, place the tool from the [original Python project](https://github.com/alfizari/Nioh-2-Save-Editor) at:

```
tools/ps4/ps4.exe
```

Most PS4 users will be using Save Wizard, which already removes the PS4-level encryption before export.

## Development

```bash
pnpm dev        # start with hot reload
pnpm typecheck  # TypeScript checks
pnpm build      # production build
pnpm build:win  # package for Windows
pnpm build:mac  # package for macOS
```

## Project Structure

```
src/
  core/            Binary parsing library (no Electron deps)
    constants.ts   All binary offsets for the Nioh 2 save format
    types.ts       TypeScript interfaces
    binary-utils.ts  readLE / writeLE helpers
    save-parser.ts   Parse weapons / items / scrolls / stats
    save-writer.ts   Write changes back to Buffer
  main/            Electron main process
    ipc-handlers.ts  File open / save / import handlers
    nioh-crypto.ts   Native AES-128 CTR encryption (cross-platform)
    save-crypto.ts   Crypto orchestration (PC native; PS4 exe fallback)
  preload/         Typed IPC bridge
  renderer/src/    React 19 UI (App.tsx + tab components)
src/data/          items.json + effects.json
tools/             Place ps4.exe here (PS4-encrypted saves only)
```

## Troubleshooting

### `Error: Electron uninstall` on `pnpm dev` (Node.js 24)

`electron@39.x` depends on `@electron/get@2.x`, whose postinstall script silently fails to extract the Electron binary under Node.js 24. The zip is downloaded to the local cache but never extracted.

**Permanent fix — use Node.js 22 LTS (recommended):**

Node.js 24 broke the postinstall extraction step. Node.js 22 LTS does not have this issue and is the current LTS release.

```bash
# With scoop
scoop install nodejs-lts   # installs Node 22 LTS
# or switch if you have multiple versions installed via scoop
```

**Workaround — manually extract the cached binary (Node.js 24):**

If you want to stay on Node.js 24, extract the binary from pnpm's local Electron cache after running `pnpm install`:

```powershell
# 1. Find the cached zip
$zip = Get-ChildItem "$env:LOCALAPPDATA\electron\Cache" -Recurse -File |
       Where-Object { $_.Name -like "electron-v*-win32-x64.zip" } |
       Select-Object -First 1 -ExpandProperty FullName

# 2. Extract it into the electron package dist folder
$dist = Resolve-Path "node_modules\electron\dist"
Expand-Archive -Path $zip -DestinationPath $dist -Force

# 3. Write the marker files
[System.IO.File]::WriteAllText("$dist\..\path.txt", "electron.exe")
[System.IO.File]::WriteAllText("$dist\version", "v39.2.6")
```

You will need to repeat this after every `pnpm install` that updates the `electron` package.

---

## Credits

- Original Python editor: [alfizari/Nioh-2-Save-Editor](https://github.com/alfizari/Nioh-2-Save-Editor)
- Encryption algorithm: [pawREP/Nioh-Savedata-Decryption-Tool](https://github.com/pawREP/Nioh-Savedata-Decryption-Tool) (MIT)
- Save format research by the Save Wizard community
