# SteamPipe upload

1. In Steamworks, create the app (you get `APP_ID`) and one depot per OS
   (Windows, macOS, Linux). Replace `APP_ID`, `DEPOT_WIN`, `DEPOT_MAC`,
   `DEPOT_LINUX` in these files with the real numbers. Put the App ID in
   `../steam_appid.txt` too.
2. Build each OS (or download the `doorbuster-*` artifacts from the GitHub
   Actions run) into `../dist/` so you have `win-unpacked/`, `mac/` and
   `linux-unpacked/`.
3. Install the Steamworks SDK, then from this folder:

   ```
   steamcmd +login <your_steam_build_account> +run_app_build ../steampipe/app_build.vdf +quit
   ```

4. In Steamworks → SteamPipe → Builds, set the new build live on a beta
   branch first, test it through the Steam client, then promote to default.

Launch options to set in Steamworks (Installation → General):

| OS | Executable |
|---|---|
| Windows | `Doorbuster.exe` |
| macOS | `Doorbuster.app` |
| Linux | `doorbuster` (add `--no-sandbox` only if the Steam Linux Runtime needs it) |

Steam Cloud: Electron keeps `localStorage` under the user-data folder. Enable
Auto-Cloud with these roots:

| OS | Root | Path |
|---|---|---|
| Windows | `WinAppDataRoaming` | `Doorbuster/Local Storage` |
| macOS | `MacAppSupport` | `Doorbuster/Local Storage` |
| Linux | `LinuxXdgConfigHome` | `Doorbuster/Local Storage` |
