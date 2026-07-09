#!/usr/bin/env node

/**
 * Load local development secrets from HashiCorp Vault before starting a
 * command. Values already present in the process environment take precedence.
 */

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

function parseEnv(filePath) {
  const result = {};

  try {
    const content = readFileSync(filePath, "utf8");

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      result[key] = value;
    }
  } catch {
    // Local environment files are optional.
  }

  return result;
}

const envFile = parseEnv(resolve(projectRoot, ".env"));
const envLocalFile = parseEnv(resolve(projectRoot, ".env.local"));

for (const [key, value] of Object.entries(envFile)) {
  if (!process.env[key]) process.env[key] = value;
}

for (const [key, value] of Object.entries(envLocalFile)) {
  if (!process.env[key]) process.env[key] = value;
}

const vaultAddress = process.env.VAULT_ADDR;
const vaultToken = process.env.VAULT_TOKEN;
const vaultSecretPath = process.env.VAULT_SECRET_PATH;

async function loadVaultSecrets() {
  if (!vaultAddress || !vaultToken) {
    console.log(
      "[vault] VAULT_ADDR or VAULT_TOKEN not set — skipping Vault secrets",
    );
    return;
  }

  if (!vaultSecretPath || !vaultSecretPath.includes("/")) {
    console.error(
      "[vault] VAULT_SECRET_PATH must include the mount and secret path",
    );
    process.exit(1);
  }

  const [mount, ...pathParts] = vaultSecretPath.split("/");
  const address = vaultAddress.replace(/\/$/, "");
  const url = `${address}/v1/${mount}/data/${pathParts.join("/")}`;

  console.log(`[vault] Loading secrets from ${url} …`);

  let response;
  try {
    response = await fetch(url, {
      headers: { "X-Vault-Token": vaultToken },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[vault] Unable to reach Vault: ${message}`);
    process.exit(1);
  }

  if (!response.ok) {
    console.error(`[vault] Request failed with status ${response.status}`);
    process.exit(1);
  }

  const json = await response.json();
  const secrets = json?.data?.data;

  if (!secrets || typeof secrets !== "object") {
    console.error("[vault] Response does not contain KV v2 secret data");
    process.exit(1);
  }

  let loadedCount = 0;
  for (const [key, value] of Object.entries(secrets)) {
    if (typeof value === "string" && !process.env[key]) {
      process.env[key] = value;
      loadedCount++;
    }
  }

  console.log(`[vault] Loaded ${loadedCount} secrets from ${vaultSecretPath}`);
}

await loadVaultSecrets();

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/vault-dev.mjs <command> [args...]");
  process.exit(1);
}

if (process.env.PORT && !args.includes("-p") && !args.includes("--port")) {
  args.push("-p", process.env.PORT);
}

const child = spawn(command, args, {
  stdio: "inherit",
  env: process.env,
  cwd: projectRoot,
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

process.on("SIGINT", () => {
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  child.kill("SIGTERM");
});
