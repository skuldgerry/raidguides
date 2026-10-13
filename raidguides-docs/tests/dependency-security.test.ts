import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

// Run the advisory triggers in bounded children: a vulnerable generator must
// fail the test rather than hang the runner, and process.exit must be observable.
function checkInChild(script: string) {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
    timeout: 5_000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /checks completed/);
}

for (const module of ['nanoid', 'nanoid/async']) {
  test(`${module} zero-size custom generators terminate and ordinary IDs still work`, () => {
    checkInChild(`
      import assert from 'node:assert/strict';
      import { customAlphabet } from '${module}';
      assert.equal(await customAlphabet('abc', 0)(), '');
      const generate = customAlphabet('abc', 10);
      assert.equal(await generate(0), '');
      assert.match(await generate(), /^[abc]{10}$/);
      console.log('checks completed');
    `);
  });
}

test('baseline invalid options throw without terminating the caller', () => {
  checkInChild(`
    import assert from 'node:assert/strict';
    import { getCompatibleVersions, getAllVersions } from 'baseline-browser-mapping';
    assert.throws(() => getCompatibleVersions({
      targetYear: 2024, widelyAvailableOnDate: '2024-01-01', suppressWarnings: true,
    }));
    assert.throws(() => getAllVersions({
      includeKaiOS: true, includeDownstreamBrowsers: false, suppressWarnings: true,
    }));
    assert.ok(getCompatibleVersions({ targetYear: 2024, suppressWarnings: true }).length > 0);
    console.log('checks completed');
  `);
});
