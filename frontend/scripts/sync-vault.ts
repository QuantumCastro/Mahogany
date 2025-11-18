import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

type Options = {
  source: string;
  vault: string;
  clean: boolean;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const frontendRoot = process.cwd();
  const sourceDir = path.resolve(frontendRoot, options.source);
  const contentDir = path.join(frontendRoot, "content");
  const targetDir = path.join(contentDir, options.vault);

  if (!existsSync(sourceDir)) {
    throw new Error(`[sync-vault] La carpeta fuente no existe: ${sourceDir}`);
  }

  await fs.mkdir(contentDir, { recursive: true });

  if (options.clean && existsSync(targetDir)) {
    await fs.rm(targetDir, { recursive: true, force: true });
  }

  await copyDirectory(sourceDir, targetDir);
  console.log(
    `[sync-vault] Copiado el contenido desde ${sourceDir} hacia ${targetDir}. Ejecuta "pnpm run vault:build" para regenerar los índices.`,
  );
}

async function copyDirectory(source: string, target: string) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    source: process.env.VAULT_SOURCE_DIR ?? "",
    vault: process.env.VAULT_NAME ?? "demo",
    clean: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--clean") {
      options.clean = true;
    } else if (arg.startsWith("--source=")) {
      options.source = arg.split("=")[1];
    } else if (arg === "--source") {
      options.source = args[++i];
    } else if (arg.startsWith("--vault=")) {
      options.vault = arg.split("=")[1];
    } else if (arg === "--vault") {
      options.vault = args[++i];
    }
  }

  if (!options.source) {
    throw new Error(
      '[sync-vault] Debes indicar la carpeta fuente con "--source <ruta>" o la variable VAULT_SOURCE_DIR.',
    );
  }

  return options;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
