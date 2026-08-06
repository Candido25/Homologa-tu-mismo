import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ignored = new Set([".git", ".next", "node_modules"]);
const extensions = new Set([".js", ".mjs", ".ts", ".tsx", ".json", ".md", ".sql", ".yml", ".yaml", ".env.example"]);
const patterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /service_role[_-]key\s*[:=]\s*['"][^'"]+['"]/i,
  /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
];

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (extensions.has(path.extname(entry.name)) || entry.name === ".env.example") {
      yield fullPath;
    }
  }
}

const findings = [];
for await (const file of walk(root)) {
  const content = await readFile(file, "utf8");
  for (const pattern of patterns) {
    if (pattern.test(content)) findings.push(path.relative(root, file));
  }
}

if (findings.length > 0) {
  throw new Error(`Posibles secretos encontrados: ${[...new Set(findings)].join(", ")}`);
}

console.log("secret_scan_ok");
