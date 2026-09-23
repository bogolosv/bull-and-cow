import type { Snapshot } from "./engine";
type StoredRoom = {
  room: Snapshot["rooms"][number][1];
  match?: Snapshot["matches"][number][1];
  secrets: [string, string][];
};
type Meta = Pick<Snapshot, "version" | "sessions">;

// Individual rooms stay below the per-value limit and unchanged rooms do not
// consume another SQLite write when another room advances or a lease is checked.
export class GameStorage {
  private persisted = new Map<string, string>();
  constructor(private storage: DurableObjectStorage) {}
  async load(): Promise<Snapshot | undefined> {
    const meta = await this.storage.get<Meta>("meta");
    if (!meta) return undefined;
    if (meta.version !== 1)
      throw new Error("Unsupported stored schema version");
    this.persisted.set("meta", JSON.stringify(meta));
    const rooms = await this.storage.list<StoredRoom>({ prefix: "room:" });
    const snapshot: Snapshot = { ...meta, rooms: [], matches: [], secrets: [] };
    for (const [key, value] of rooms) {
      this.persisted.set(key, JSON.stringify(value));
      snapshot.rooms.push([value.room.id, value.room]);
      if (value.match) snapshot.matches.push([value.room.id, value.match]);
      if (value.secrets.length)
        snapshot.secrets.push([value.room.id, value.secrets]);
    }
    return snapshot;
  }
  async save(snapshot: Snapshot, alarm: number | null) {
    const records = new Map<string, unknown>([
      ["meta", { version: snapshot.version, sessions: snapshot.sessions }],
    ]);
    const matches = new Map(snapshot.matches),
      secrets = new Map(snapshot.secrets);
    for (const [id, room] of snapshot.rooms) {
      const match = matches.get(id);
      records.set(`room:${id}`, {
        room,
        ...(match ? { match } : {}),
        secrets: secrets.get(id) ?? [],
      } satisfies StoredRoom);
    }
    const serialized = new Map(
      [...records].map(([key, value]) => [key, JSON.stringify(value)]),
    );
    await this.storage.transaction(async (txn) => {
      for (const [key, value] of records)
        if (this.persisted.get(key) !== serialized.get(key))
          await txn.put(key, value);
      for (const key of this.persisted.keys())
        if (!records.has(key)) await txn.delete(key);
      if (alarm === null) await txn.deleteAlarm();
      else await txn.setAlarm(Math.max(Date.now() + 1, alarm));
    });
    this.persisted = serialized;
  }
}
