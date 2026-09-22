const KEY = "bull-cow-session";
let memory: string | null = null;

function read(storage: "sessionStorage" | "localStorage") {
  try {
    return globalThis[storage].getItem(KEY);
  } catch {
    return null;
  }
}

export function getSessionToken() {
  // Keep an existing tab's identity; a reopened tab resumes the browser's
  // most recently saved session. The server still enforces its grace period.
  return read("sessionStorage") || read("localStorage") || memory;
}

export function saveSessionToken(token: string) {
  memory = token;
  for (const storage of ["sessionStorage", "localStorage"] as const) {
    try {
      globalThis[storage].setItem(KEY, token);
    } catch {
      // Each storage is optional; same-page recovery also works from memory.
    }
  }
}
