# Nioh 3 PC Decryption Tool

Place `pc.exe` from the **PC/** folder of the reference project here:

https://github.com/alfizari/Nioh-3-Save-Editor

## How it works

- `pc.exe SAVEDATA.BIN` → creates `decr_SAVEDATA.BIN` (decrypted)
- `pc.exe decr_SAVEDATA.BIN` → creates `decr_decr_SAVEDATA.BIN` (re-encrypted)

The save editor copies your save file into this directory, runs the tool, then reads the output.
