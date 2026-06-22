import { spawn } from "node:child_process";

const tscArgs = ["-p", "tsconfig.build.json", "--watch", "--preserveWatchOutput"];
const nodeArgs = ["--enable-source-maps", "--watch", "dist/main.js"];
const tscCommand = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "tsc";
const platformTscArgs =
  process.platform === "win32" ? ["/d", "/s", "/c", "tsc", ...tscArgs] : tscArgs;

let apiProcess;
let shuttingDown = false;

const tscProcess = spawn(tscCommand, platformTscArgs, {
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

tscProcess.stdout.on("data", (chunk) => {
  const output = chunk.toString();
  process.stdout.write(output);

  if (output.includes("Found 0 errors") && !apiProcess) {
    startApi();
  }
});

tscProcess.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

tscProcess.on("exit", (code, signal) => {
  if (shuttingDown) {
    return;
  }

  console.error(`TypeScript watcher exited with ${formatExit(code, signal)}.`);
  shutdown(code ?? 1);
});

function startApi() {
  apiProcess = spawn(process.execPath, nodeArgs, {
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  });

  apiProcess.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    console.error(`API dev server exited with ${formatExit(code, signal)}.`);
    shutdown(code ?? 1);
  });
}

function formatExit(code, signal) {
  if (signal) {
    return `signal ${signal}`;
  }

  return `code ${code ?? 0}`;
}

function shutdown(exitCode = 0) {
  shuttingDown = true;
  apiProcess?.kill();
  tscProcess.kill();
  process.exitCode = exitCode;
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
