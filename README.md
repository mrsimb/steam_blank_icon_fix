# steam_blank_icon_fix
Fixes blank icons for Steam games shortcuts

## Requirements
[deno](https://deno.land/manual/getting_started/installation)

## Permissions
```--allow-net``` Uses [steamdb.info](https://steamdb.info) to find and download icons

```--allow-read``` Reads shortcuts and checks if they're broken

```--allow-write``` Fixes broken shortcuts and recovers icon files in your Steam folder

## Usage
Fix icons in the current folder:

```deno run --allow-net --allow-read --allow-write fix.ts```

Fix icons in a specified folder:

```deno run --allow-net --allow-read --allow-write fix.ts C:\Users\username\Desktop```
