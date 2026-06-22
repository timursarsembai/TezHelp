import { createReadStream, createWriteStream, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

const composeArgs = [
  "compose",
  "--env-file",
  ".env.example",
  "-f",
  "infrastructure/docker/docker-compose.yml",
];
const postgresUser = process.env.POSTGRES_USER ?? "tezhelp";
const postgresDatabase = process.env.POSTGRES_DB ?? "tezhelp";
const validationDatabase = "tezhelp_restore_validation";
const backupPath = resolve(
  "backups",
  "postgres",
  `tezhelp-${new Date().toISOString().replace(/[:.]/g, "-")}.dump`,
);

async function main() {
  mkdirSync(dirname(backupPath), { recursive: true });

  await runDocker(["ps", "--status", "running", "postgres"], {
    expectedOutputIncludes: "postgres",
    description: "check postgres container",
  });

  await dumpMainDatabase();
  const backupSize = statSync(backupPath).size;
  if (backupSize === 0) {
    throw new Error("Backup file is empty");
  }

  await dropValidationDatabaseIfExists();
  try {
    await runPsql("postgres", `create database ${validationDatabase};`);
    await restoreValidationDatabase();
    await assertQuery(
      validationDatabase,
      "select count(*)::int from pg_extension where extname = 'postgis';",
      "1",
      "PostGIS extension is missing after restore",
    );
    await assertQuery(
      validationDatabase,
      "select count(*)::int from pgmigrations where name = '000009_reputation_sanctions';",
      "1",
      "Latest migration metadata is missing after restore",
    );
  } finally {
    await dropValidationDatabaseIfExists();
  }

  console.log(`Backup validation passed: ${backupPath} (${backupSize} bytes)`);
}

async function dumpMainDatabase() {
  const dump = spawnDocker([
    "exec",
    "-T",
    "postgres",
    "pg_dump",
    "-U",
    postgresUser,
    "-d",
    postgresDatabase,
    "-Fc",
    "--no-owner",
    "--no-privileges",
  ]);
  const output = createWriteStream(backupPath);
  await pipeline(dump.stdout, output);
  const stderr = await collectStream(dump.stderr);
  const exitCode = await waitForExit(dump);
  if (exitCode !== 0) {
    throw new Error(`pg_dump failed with code ${exitCode}: ${stderr}`);
  }
}

async function restoreValidationDatabase() {
  await runDocker(
    [
      "exec",
      "-T",
      "postgres",
      "pg_restore",
      "-U",
      postgresUser,
      "-d",
      validationDatabase,
      "--no-owner",
      "--no-privileges",
    ],
    {
      stdinFile: backupPath,
      description: "restore validation database",
    },
  );
}

async function dropValidationDatabaseIfExists() {
  await runPsql(
    "postgres",
    `
      select pg_terminate_backend(pid)
      from pg_stat_activity
      where datname = '${validationDatabase}';
    `,
  );
  await runPsql("postgres", `drop database if exists ${validationDatabase};`);
}

async function runPsql(database, sql) {
  await runDocker(
    [
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      postgresUser,
      "-d",
      database,
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      sql,
    ],
    {
      description: `psql ${database}`,
    },
  );
}

async function assertQuery(database, sql, expected, message) {
  const result = await runDocker(
    ["exec", "-T", "postgres", "psql", "-U", postgresUser, "-d", database, "-tAc", sql],
    {
      description: `assert ${database}`,
    },
  );
  if (result.trim() !== expected) {
    throw new Error(`${message}. Expected ${expected}, got ${result.trim() || "<empty>"}`);
  }
}

function spawnDocker(args) {
  return spawn("docker", [...composeArgs, ...args], {
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"],
  });
}

async function runDocker(args, options = {}) {
  const child = spawnDocker(args);
  let stdinError;
  if (options.stdinFile) {
    const stream = createReadStream(options.stdinFile);
    stream.pipe(child.stdin);
    stream.on("error", (error) => {
      stdinError = error;
      child.stdin.destroy(error);
    });
  } else {
    child.stdin.end();
  }

  const [stdout, stderr, exitCode] = await Promise.all([
    collectStream(child.stdout),
    collectStream(child.stderr),
    waitForExit(child),
  ]);
  if (stdinError) {
    throw stdinError;
  }
  if (exitCode !== 0) {
    throw new Error(
      `${options.description ?? args.join(" ")} failed with code ${exitCode}: ${stderr}`,
    );
  }
  if (options.expectedOutputIncludes && !stdout.includes(options.expectedOutputIncludes)) {
    throw new Error(
      `${options.description ?? args.join(" ")} did not include ${options.expectedOutputIncludes}`,
    );
  }

  return stdout;
}

async function collectStream(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
