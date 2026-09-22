const KEY = "bull-cow-session";
let memory: string | null = null;
export function getSessionToken() {
  try { return sessionStorage.getItem(KEY) || memory; }
  catch { return memory; }
}
export function saveSessionToken(token: string) {
  memory = token;
  try { sessionStorage.setItem(KEY, token); }
  catch { /* Same-page reconnect works without storage. */ }
}
