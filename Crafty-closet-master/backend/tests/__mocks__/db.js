// backend/tests/__mocks__/db.js
// Jest manual mock for the MySQL2 connection pool.
// Each test file can call pool.__setResult() to control what the mock returns.

const pool = {
  _result: [],
  _error:  null,

  // Call this in beforeEach / per-test to configure the next query response
  __setResult: (rows, insertId = 1) => {
    pool._error  = null;
    pool._result = [rows, []]; // mysql2 returns [rows, fields]
    // For INSERT queries, mysql2 returns [ResultSetHeader, fields]
    if (insertId !== undefined) {
      pool._result = [{ insertId, affectedRows: rows.length || 1 }, []];
      pool._rows   = rows;
    }
  },

  // Simulate a DB error on the next query
  __setError: (err) => {
    pool._error = err;
  },

  query: jest.fn(async (sql) => {
    if (pool._error) {
      const e = pool._error;
      pool._error = null;
      throw e;
    }
    // SELECT-style: return [rows, fields]
    if (/^SELECT/i.test(sql.trim())) {
      return [pool._rows || pool._result[0] || [], []];
    }
    // INSERT/UPDATE/DELETE: return [ResultSetHeader, fields]
    return [pool._result[0] || { insertId: 1, affectedRows: 1 }, []];
  }),
};

// Reset between tests
afterEach(() => {
  pool._result = [];
  pool._rows   = undefined;
  pool._error  = null;
  pool.query.mockClear();
});

module.exports = pool;
