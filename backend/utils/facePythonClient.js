import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_WORKER_PATH = path.join(__dirname, "..", "ml", "face_worker.py");

const isLocalhostUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("0.0.0.0")
  );
};

export const runFaceWorker = async (
  payload,
  {
    timeoutMs = env.FACE_ML_TIMEOUT_MS || 30_000,
    pythonBin = process.env.FACE_PYTHON_BIN || "python3",
    workerPath = process.env.FACE_PYTHON_WORKER || DEFAULT_WORKER_PATH,
    extraEnv = {},
  } = {}
) => {
  const input = JSON.stringify(payload);

  return await new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [workerPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        MONGO_URI: env.MONGO_URI || process.env.MONGO_URI,
        ...extraEnv,
      },
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch (e) {
        // ignore
      }
      const err = new Error("Face worker timed out");
      err.code = "FACE_WORKER_TIMEOUT";
      reject(err);
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d.toString("utf8")));
    child.stderr.on("data", (d) => (stderr += d.toString("utf8")));

    child.on("error", (err) => {
      clearTimeout(timer);
      err.code = err.code || "FACE_WORKER_SPAWN_FAILED";
      err.stderr = stderr;
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      let data;
      try {
        data = stdout ? JSON.parse(stdout) : null;
      } catch (e) {
        const err = new Error("Face worker returned non-JSON output");
        err.code = "FACE_WORKER_BAD_OUTPUT";
        err.stdout = stdout;
        err.stderr = stderr;
        err.exitCode = code;
        return reject(err);
      }

      if (!data) {
        const err = new Error("Face worker returned empty output");
        err.code = "FACE_WORKER_EMPTY_OUTPUT";
        err.stderr = stderr;
        err.exitCode = code;
        return reject(err);
      }

      if (code !== 0 && (data.status || 500) >= 500) {
        const err = new Error(data.error || "Face worker failed");
        err.code = "FACE_WORKER_FAILED";
        err.stderr = stderr;
        err.exitCode = code;
        err.response = { status: data.status || 500, data };
        return reject(err);
      }

      // attach stderr for debugging if present (non-fatal)
      data._stderr = stderr;
      return resolve(data);
    });

    child.stdin.write(input);
    child.stdin.end();
  });
};

export const assertNoExternalFaceService = () => {
  // Help catch accidental external HTTP config in production
  const url = env.FACE_ML_SERVICE_URL;
  if (!url) return;
  if (env.NODE_ENV === "production" && isLocalhostUrl(url)) return;
  // We don’t throw; just log so deploys don’t hard-fail.
  console.warn("[facePythonClient] FACE_SERVICE_URL/FACE_ML_SERVICE_URL is set but external service is no longer required", { url });
};

