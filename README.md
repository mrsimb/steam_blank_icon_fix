# steam_blank_icon_fix
Fixes blank icons for Steam games shortcuts

![6CCpJP2tiO](https://user-images.githubusercontent.com/7318420/129628247-d0a9cca8-a404-4987-ab69-ca4e6c35e2fb.gif)

## Requirements
[deno](https://deno.land/manual/getting_started/installation)

## Permissions
```--allow-net``` Uses [steamdb.info](https://steamdb.info) to find and download icons

```--allow-read``` Reads shortcuts and checks if they're broken

```--allow-write``` Fixes broken shortcuts and recovers icon files in your Steam folder

## Usage
Fix icons in the current folder:

```deno run --allow-net --allow-read --allow-write https://deno.land/x/steam_blank_icon_fix@1.0.2/fix.ts```

Fix icons in a specified folder:

```deno run --allow-net --allow-read --allow-write https://deno.land/x/steam_blank_icon_fix@1.0.2/fix.ts C:\Users\username\Desktop```
