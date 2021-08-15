const steamIconsPath = "C:/Program Files (x86)/Steam/steam/games";
const searchPath = String(Deno.args[0]) || ".";

console.log(`Steam icons path: "${steamIconsPath}"`);
console.log(`Searching shortcuts in: "${searchPath}"\n`);

for await (const entry of Deno.readDir(searchPath)) {
  if (!entry.isFile || !entry.name.endsWith(".url")) {
    continue;
  }

  const linkContent = await Deno.readTextFile(entry.name);
  const gameId = linkContent.match(/rungameid\/(.+)/m)?.[1];

  if (!gameId) {
    continue;
  }

  const infoHtml = await fetch(`https://steamdb.info/app/${gameId}/info/`)
    .then((res) => res.text());
  const iconUrl = infoHtml.match(/https.+\.ico/m)?.[0];
  const iconName = iconUrl?.match(/(\w|\d)+.ico/)?.[0];
  const hasIconPath = !!linkContent.match(/IconFile=.+/m);
  const hasIconFile = iconName &&
    await Deno.stat(steamIconsPath + "/" + iconName).catch(() => {});
  const status = [!hasIconPath && "unlinked", !hasIconFile && "file missing"]
    .filter(Boolean)
    .join(", ") || "ok";

  if (!hasIconPath) {
    const linkContentFixed = linkContent.replace(
      /IconFile=$/m,
      `IconFile=${steamIconsPath}/${iconName}`,
    );
    await Deno.writeTextFile(entry.name, linkContentFixed);
  }

  if (!hasIconFile && iconUrl) {
    const iconBuffer = await fetch(iconUrl).then((res) => res.arrayBuffer());
    await Deno.writeFile(
      steamIconsPath + "/" + iconName,
      new Uint8Array(iconBuffer),
    );
  }

  console.group(entry.name);
  console.log(gameId, iconName);
  console.log(status + "\n");
  console.groupEnd();
}

console.log("Done!");
