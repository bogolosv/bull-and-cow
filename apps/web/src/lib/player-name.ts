import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator";

const STORAGE_KEY = "bull-and-cow.player-name";
let cachedName: string | undefined;

export function getPlayerName(): string {
  if (cachedName !== undefined) return cachedName;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null && saved.length <= 32) {
      cachedName = saved;
      return saved;
    }
  } catch {
    /* Storage may be unavailable in a private browser context. */
  }

  cachedName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: " ",
    style: "capital",
    length: 2,
  }).slice(0, 32);
  savePlayerName(cachedName);
  return cachedName;
}

export function savePlayerName(name: string) {
  cachedName = name;
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    /* Keep the name in memory if persistent storage is unavailable. */
  }
}
