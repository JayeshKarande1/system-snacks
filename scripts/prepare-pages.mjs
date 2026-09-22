import { access, cp, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist/client");
const nested = path.join(root, "system-snacks");
await access(path.join(root, "index.html"));
await access(path.join(nested, "_next"));
await cp(path.join(nested, "_next"), path.join(root, "_next"), { recursive: true });
// Only remove this build-owned, known child after copying its assets.
await rm(nested, { recursive: true });
await writeFile(path.join(root, ".nojekyll"), "");
const html = await readFile(path.join(root, "index.html"), "utf8");
const refs = [...html.matchAll(/(?:src|href)="(\/[^"?#]+)"/g)].map(m => m[1]);
for (const ref of new Set(refs)) {
  if (!ref.startsWith("/system-snacks/")) throw new Error(`Unprefixed asset: ${ref}`);
  await access(path.join(root, ref.slice("/system-snacks/".length)));
}
console.log(`Pages output ready: ${new Set(refs).size} asset references verified; .nojekyll present.`);
