const assert = require('assert');
const { isVoteTabVisible, setVoteTabVisible, SETTING_KEY } = require('../utils/voteTabSettings');
const { createRequireVisibleVoteTabForClient } = require('../controllers/voteController');

const createMockDb = (initialRows = []) => {
  const calls = [];
  let rows = initialRows;

  return {
    calls,
    async query(sql, params = []) {
      calls.push({ sql, params });

      if (sql.includes('SELECT value FROM app_settings')) {
        return [rows, {}];
      }

      if (sql.includes('INSERT INTO app_settings')) {
        rows = [{ value: params[1] }];
        return [[], {}];
      }

      return [[], {}];
    }
  };
};

(async () => {
  const defaultDb = createMockDb([]);
  assert.strictEqual(await isVoteTabVisible(defaultDb), true, 'vote tab is visible by default');

  const hiddenDb = createMockDb([{ value: 'false' }]);
  assert.strictEqual(await isVoteTabVisible(hiddenDb), false, 'false setting hides vote tab');

  const visibleDb = createMockDb([{ value: 'true' }]);
  assert.strictEqual(await isVoteTabVisible(visibleDb), true, 'true setting shows vote tab');

  const updateDb = createMockDb([]);
  await setVoteTabVisible(updateDb, false);
  const insertCall = updateDb.calls.find((call) => call.sql.includes('INSERT INTO app_settings'));
  assert.deepStrictEqual(insertCall.params, [SETTING_KEY, 'false'], 'setting update persists false value');

  const runMiddleware = async (visible, role = 'client') => {
    const middleware = createRequireVisibleVoteTabForClient(async () => visible);
    const req = { user: { role } };
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };
    let nextCalled = false;

    await middleware(req, res, () => {
      nextCalled = true;
    });

    return { res, nextCalled };
  };

  const hiddenClient = await runMiddleware(false, 'client');
  assert.strictEqual(hiddenClient.nextCalled, false, 'hidden vote tab blocks client route');
  assert.strictEqual(hiddenClient.res.statusCode, 403, 'hidden vote tab returns 403 for clients');

  const visibleClient = await runMiddleware(true, 'client');
  assert.strictEqual(visibleClient.nextCalled, true, 'visible vote tab allows client route');

  const hiddenAdmin = await runMiddleware(false, 'admin');
  assert.strictEqual(hiddenAdmin.nextCalled, true, 'hidden vote tab does not block admin vote management');

  console.log('voteTabSettings tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
