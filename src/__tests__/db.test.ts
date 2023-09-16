import { db } from '../db';
import * as fs from 'fs';

describe('SQLite test.db', () => {
  beforeAll(() => {
    // test-only database file
    process.env.SQLITE_DB_LOCATION = 'test.db';
  });

  afterAll(() => {
    db.close();
    const dbLocation = 'test.db';
    if (fs.existsSync(dbLocation)) {
      fs.unlinkSync(dbLocation);
    }
  });

  it('should create the registry table', async () => {
    // This test will use a real database connection and check if the "registry" table exists
    const checkTableQuery = "SELECT name FROM sqlite_master WHERE type='table' AND name='registry';";

    const tableExists = await new Promise((resolve) => {
        db.get(checkTableQuery, [], (err, row: {name: string}) => {
          if (err) {
            resolve(false);
          } else {
            resolve(!!row);
          }
        });
      });
  
      // Assert that the "registry" table exists
      expect(tableExists).toBe(true);
  });
});
