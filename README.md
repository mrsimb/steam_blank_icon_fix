# steam-blank-icon
Fixes blank icons of Steam desktop shortcuts in Windows.

## Requirements
[deno 2](https://deno.land/manual/getting_started/installation)

## Permissions
`-N` Loads icon files from Steam CDN

`-R` Reads Steam folder and shortcut files

`-W` Fixes broken shortcuts and recovers icon files in your Steam folder

`--allow-run` Runs `reg.exe` to find Steam installation path in Windows registry (only if default path wasn't found)

## Usage

### Via command line

Fix icons in the current folder:

```cmd
cd C:/Users/<username>/Desktop

deno run -N -R -W --allow-run jsr:@mrsimb/steam-blank-icon
```

Fix in specific folders:

```cmd
deno run -N -R -W --allow-run jsr:@mrsimb/steam-blank-icon "C:/Users/<username>/Desktop/Games" "E:/Games"
```

Fix specific icons:

```cmd
deno run -N -R -W --allow-run jsr:@mrsimb/steam-blank-icon "E:/Games/Hades.url" "E:/Games/Cave Story.url"
```

Use `--steampath` flag to specify steam installation path (if auto detection fails):

```cmd
deno run -N -R -W --allow-run jsr:@mrsimb/steam-blank-icon --steampath="E:/Apps/Steam"
```

You can omit permission flags if you want to be asked before taking any action:

```cmd
deno run jsr:@mrsimb/steam-blank-icon
```


### Via .bat script

Create a file called `fix.bat` and paste this code:
```cmd
deno run -N -R -W --allow-run jsr:@mrsimb/steam-blank-icon %*
pause
```

Then save it and just drag & drop a folder or files onto `fix.bat`.