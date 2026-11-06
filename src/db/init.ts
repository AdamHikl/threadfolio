import type { SQLiteDatabase } from 'expo-sqlite';

import { migrate } from './migrations';
import { seedSampleDataIfEmpty } from './sampleData';

export const DATABASE_NAME = 'threadfolio.db';

/** Runs before the app renders: apply migrations, then seed sample data in dev builds. */
export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await migrate(db);
  if (__DEV__) await seedSampleDataIfEmpty(db);
}
