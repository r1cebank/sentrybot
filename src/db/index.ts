import path from 'path';

import config from 'config';
import Lowdb from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';

export type UserRecord = {
  readonly id: number;
  readonly notify: readonly string[];
};

export type DBSchema = {
  readonly users: readonly UserRecord[];
};

const adapter = new FileAsync<DBSchema>(
  path.join(config.get('db.path'), config.get('db.file'))
);

export const getDb = async () => {
  const db = await Lowdb(adapter);
  await db
    .defaults<DBSchema>({ users: [] })
    .write();
  return db;
};
