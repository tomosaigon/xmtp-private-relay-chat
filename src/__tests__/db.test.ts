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

  it('should create the registry table', (done) => {
    // This test will use a real database connection and check if the "registry" table exists
    const checkTableQuery = "SELECT name FROM sqlite_master WHERE type='table' AND name='registry';";

    db.get(checkTableQuery, [], (err: Error, row: any) => {
      if (err) {
        done.fail(err);
        return;
      }

      if (row && row.name === 'registry') {
        // The "registry" table exists
        done();
      } else {
        done.fail('The "registry" table does not exist.');
      }
    });
  });
});
