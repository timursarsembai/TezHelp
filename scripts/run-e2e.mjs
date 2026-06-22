import { spawn } from "node:child_process";

const root = process.cwd();

const servers = [
  {
    name: "web",
    cwd: "apps/web",
    args: ["node_modules/next/dist/bin/next", "dev", "--port", "3000"],
    port: 3000,
    url: "http://127.0.0.1:3000",
  },
  {
    name: "admin",
    cwd: "apps/admin",
    args: ["node_modules/next/dist/bin/next", "dev", "--port", "3001"],
    port: 3001,
    url: "http://127.0.0.1:3001",
  },
];

const children = [];

async function main() {
  if (process.platform === "win32") {
    await Promise.all(servers.map((server) => stopWindowsPort(server.port)));
  }

  for (const server of servers) {
    children.push(startServer(server));
  }

  await Promise.all(servers.map((server) => waitForUrl(server.url)));

  const result = await runCommand(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test"],
    {
      PLAYWRIGHT_SKIP_WEBSERVER: "true",
    },
  );

  process.exitCode = result;
}

function startServer(server) {
  const child = spawn(process.execPath, server.args, {
    cwd: `${root}/${server.cwd}`,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${server.name}] ${data}`);
  });
  child.stderr.on("data", (data) => {
    process.stderr.write(`[${server.name}] ${data}`);
  });

  return child;
}

async function waitForUrl(url) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 120_000) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      await sleep(500);
    }
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function runCommand(command, args, extraEnv) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...extraEnv },
      stdio: "inherit",
      windowsHide: true,
    });

    child.on("exit", (code) => {
      resolve(code ?? 1);
    });
  });
}

async function stopChild(child) {
  if (!child.pid || child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");
  await sleep(500);
  if (child.exitCode === null) {
    child.kill("SIGKILL");
  }
}

async function stopWindowsPort(port) {
  const command = [
    "$listenPids = netstat -ano | Select-String 'LISTENING' |",
    `Select-String ':${port}\\s' |`,
    "ForEach-Object { ($_ -split '\\s+')[-1] } |",
    "Sort-Object -Unique;",
    "foreach ($listenPid in $listenPids) {",
    "if ($listenPid -and $listenPid -ne '0') {",
    "Stop-Process -Id ([int] $listenPid) -Force -ErrorAction SilentlyContinue",
    "}",
    "}",
  ].join(" ");

  await runCommand("powershell.exe", ["-NoProfile", "-Command", command], {});
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

try {
  await main();
} finally {
  await Promise.all(children.map((child) => stopChild(child)));
  if (process.platform === "win32") {
    await Promise.all(servers.map((server) => stopWindowsPort(server.port)));
  }
}
