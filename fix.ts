import { parseArgs } from "jsr:@std/cli/parse-args";
import { join } from "jsr:@std/path";

const DEFAULT_STEAM_PATH = "c:/program files (x86)/steam";

const flags = parseArgs(Deno.args, {
  string: ["steampath"],
});

async function getSteamPathFromRegistry() {
  console.log("Searching in Windows registry...");

  const args = ["query", "HKCU\\Software\\Valve\\Steam", "/v", "SteamPath"];
  const process = new Deno.Command("reg", { args });
  const { stdout } = await process.output();

  const output = new TextDecoder().decode(stdout).trim();
  const match = output.match(/SteamPath\s+REG_SZ\s+(.+)/);

  if (!match) {
    throw new Error("Couldn't find steam path in registry");
  }

  return match[1].trim();
}

async function resolveSteamIconsPath(installPath: string) {
  const iconsPath = join(installPath, "/steam/games");
  const { isDirectory } = await Deno.stat(iconsPath);
  if (isDirectory) {
    return iconsPath;
  }
  throw new Error(`${iconsPath} is not a directory`);
}

async function getSteamIconsPath() {
  console.log("Searching for steam installation path...");
  if (flags.steampath) {
    return await resolveSteamIconsPath(flags.steampath);
  }
  try {
    return await resolveSteamIconsPath(DEFAULT_STEAM_PATH);
  } catch {
    return await resolveSteamIconsPath(await getSteamPathFromRegistry());
  }
}

const steamIconsPath = await getSteamIconsPath();
console.log(`Steam icons path: "${steamIconsPath}"`);

const searchPath = String(flags._ || ".");
console.log(`Searching shortcuts in: "${searchPath}"\n`);

try {
  for await (const entry of Deno.readDir(searchPath)) {
    if (!entry.isFile || !entry.name.endsWith(".url")) {
      continue;
    }

    const linkContent = await Deno.readTextFile(join(searchPath, entry.name));
    const appId = linkContent.match(/rungameid\/(.+)/m)?.[1];
    if (!appId) {
      continue;
    }

    const iconPath = linkContent.match(/IconFile=(.+)/);
    if (!iconPath) {
      console.log(`✗ ${entry.name} - no icon path found`);
      continue;
    }

    const iconName = iconPath[1].split("\\").pop()!;

    const hasIconFile = await Deno.stat(join(steamIconsPath, iconName))
      .then((info) => info.isFile)
      .catch(() => false);

    if (hasIconFile) {
      console.log(`✓ ${entry.name}`);
      continue;
    }

    const iconUrl =
      `http://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${appId}/${iconName}`;

    const iconResponse = await fetch(iconUrl).catch(() => null);

    if (!iconResponse?.ok) {
      console.log(`✗ ${entry.name} - failed to fetch icon`);
      continue;
    }

    const iconBuffer = await iconResponse.arrayBuffer();

    await Deno.writeFile(
      join(steamIconsPath, iconName),
      new Uint8Array(iconBuffer),
    );
    console.log(`✓ ${entry.name} - fixed`);
  }
} catch {
  console.log(`Failed to read ${searchPath}`);
}

console.log("Done!");
