import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Ordered schema migrations. Migration N (1-based) brings the database to
 * `PRAGMA user_version = N`. Never edit a shipped migration; add a new one.
 */
export const MIGRATIONS: string[] = [
  // 1: items, photos, outfits
  `
  CREATE TABLE item (
    id TEXT PRIMARY KEY NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('collection', 'wishlist')),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    era TEXT,
    colour TEXT,
    size TEXT,
    notes TEXT,
    price_paid INTEGER,
    target_price INTEGER,
    new_low INTEGER,
    new_high INTEGER,
    vintage_low INTEGER,
    vintage_high INTEGER,
    confidence REAL,
    acquired_at TEXT,
    acquired_where TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX item_status_idx ON item (status, created_at);

  CREATE TABLE item_photo (
    id TEXT PRIMARY KEY NOT NULL,
    item_id TEXT NOT NULL REFERENCES item (id) ON DELETE CASCADE,
    uri TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'main' CHECK (kind IN ('main', 'label', 'detail', 'cutout')),
    created_at TEXT NOT NULL
  );
  CREATE INDEX item_photo_item_idx ON item_photo (item_id);

  CREATE TABLE outfit (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    occasion TEXT,
    season TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE outfit_item (
    outfit_id TEXT NOT NULL REFERENCES outfit (id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES item (id) ON DELETE CASCADE,
    x REAL NOT NULL DEFAULT 0,
    y REAL NOT NULL DEFAULT 0,
    scale REAL NOT NULL DEFAULT 1,
    z INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (outfit_id, item_id)
  );
  `,
];

export const DATABASE_VERSION = MIGRATIONS.length;

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < DATABASE_VERSION) {
    const sql = MIGRATIONS[version];
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}
