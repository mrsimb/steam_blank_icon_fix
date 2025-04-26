import { parseArgs } from "jsr:@std/cli/parse-args";
import { join, resolve } from "jsr:@std/path";

const DEFAULT_STEAM_PATH = "c:/program files (x86)/steam";

async function getSteamPathFromRegistry() {
  console.log("📖 Searching in Windows registry");

  const args = ["query", "HKCU\\Software\\Valve\\Steam", "/v", "SteamPath"];
  const process = new Deno.Command("reg", { args });
  const { stdout } = await process.output();

  const output = new TextDecoder().decode(stdout).trim();
  const match = output.match(/SteamPath\s+REG_SZ\s+(.+)/);

  if (!match) {
    throw new Error("❌ Couldn't find Steam path in registry");
  }

  return match[1].trim();
}

async function resolveSteamIconsPath(installPath: string) {
  console.log(`🔍 Checking "${installPath}"`);

  const iconsPath = join(installPath, "/steam/games");
  const isDirectory = await Deno.stat(iconsPath)
    .then((info) => info.isDirectory)
    .catch(() => false);

  if (isDirectory) {
    console.log(`📁 Found ${iconsPath}\n`);
    return iconsPath;
  } else {
    throw new Error(`❌ Not a directory: ${iconsPath}`);
  }
}

async function getSteamIconsPath(steampath?: string) {
  console.log("🔍 Searching for steam installation path");

  if (steampath) {
    // Will not try to search elsewhere is steampath is specified explicitly
    return await resolveSteamIconsPath(steampath);
  }

  // Check the default Steam folder first, then try checking in the Windows registry
  return await resolveSteamIconsPath(DEFAULT_STEAM_PATH).catch(async () =>
    resolveSteamIconsPath(await getSteamPathFromRegistry())
  );
}

let totalCount = 0;
let fixedCount = 0;

async function processShortcut(shortcutPath: string, steamIconsPath: string) {
  const linkContent = await Deno.readTextFile(shortcutPath);

  const appId = linkContent.match(/rungameid\/(.+)/m)?.[1];
  if (!appId) {
    return; // Not a Steam shortcut
  }

  totalCount++;

  const iconPath = linkContent.match(/IconFile=(.+)/);

  if (!iconPath) {
    return console.log(`❌ ${shortcutPath} - icon file path missing\n`);
  }

  const iconName = iconPath[1].split("\\").pop()!;

  const hasIconFile = await Deno.stat(join(steamIconsPath, iconName))
    .then((info) => info.isFile)
    .catch(() => false);

  if (hasIconFile) {
    return; // Nothing to fix
  }

  // Thanks @Dark-talon for sharing this url
  // https://github.com/mrsimb/steam_blank_icon_fix/issues/1#issuecomment-1897934510
  const iconUrl =
    `http://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${appId}/${iconName}`;

  console.log(`🌐 Fetching ${iconName}`);

  const iconBuffer = await fetch(iconUrl).then(res => res.arrayBuffer()).catch(() => null);
  if (!iconBuffer) {
    return console.log(
      `🚫 ${iconName} - failed to fetch\n`,
    );
  }

  console.log(`💾 Saving ${iconName}`);

  await Deno.writeFile(
    join(steamIconsPath, iconName),
    new Uint8Array(iconBuffer),
  );

  fixedCount++;
  console.log(`☑️ ${shortcutPath}\n`);
}

async function processPath(path: string, steamIconsPath: string) {
  const info = await Deno.stat(path).catch(() => null);
  if (!info) return;
  if (info.isDirectory) {
    for await (const entry of Deno.readDir(path)) {
      await processPath(join(path, entry.name), steamIconsPath);
    }
  } else if (info.isFile) {
    await processShortcut(path, steamIconsPath).catch((error) =>
      console.log(error)
    );
  }
}

async function main() {
  const flags = parseArgs(Deno.args, { string: ["steampath"] });

  const steamIconsPath = await getSteamIconsPath(flags.steampath).catch(
    (error) => {
      console.log(error.message);
      console.log(
        `❔ Do you have Steam installed? Try specifying the Steam path manually: deno run fix.ts --steampath="path/to/your/steam/folder"`,
      );
      Deno.exit(1);
    },
  );

  const cwd = Deno.cwd();
  const searchPaths = flags._.length ? flags._.map(String) : ["."];

  for (const searchPath of searchPaths) {
    await processPath(resolve(cwd, searchPath), steamIconsPath);
  }

  if (!totalCount) {
    console.log(
      `✨ No Steam shortcuts were found. Did you specify a correct path?`,
    );
  } else {
    console.log(
      `✨ ${fixedCount} of ${totalCount} Steam shortcuts were fixed!`,
    );
  }
}

await main();
