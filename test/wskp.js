/*
 * Copyright 2017 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const { exec } = require('child-process-promise');
const assert = require('assert');
const utils = require('./helpers/utils');

it('testing wskp with no args', async () => {
    const output = await exec('./dist/wskp.js');
    assert.ok(output.stdout.includes('Apache OpenWhisk CLI with extensions'));
})

describe('testing environment', function () {
    const wskp = '../../dist/wskp.js'
    const cwd = 'test/fixtures'

    it('with no args', async () => {
        const output = await exec(`${wskp} env`, { cwd });
        assert.ok(output.stdout.includes('Apache OpenWhisk CLI with extensions'));
    });

    it('env list', async () => {
        const output = await exec(`${wskp} env list`, { cwd });
        assert.strictEqual(output.stdout, 'test\n\n');
    });

    it('env set test', async () => {
        const output = await exec(`${wskp} env set test`, { cwd });
        assert.strictEqual(output.stdout, '');
    });

    it('env set invalid environment name', async () => {
        try {
            const output = await exec(`${wskp} env set invalidenv`, { cwd });
            assert.ok(false);
        } catch (e) {
            assert.strictEqual(e.stderr, 'invalidenv does not exist\n');
        }
    });
});

describe('testing deploy', function () {
    const ctx = {};
    before(utils.before(ctx));
    after(utils.after(ctx));

    const wskp = './dist/wskp.js'

    it('with no args', async () => {
        try {
            const output = await exec(`${wskp} deploy`)
            assert.ok(false);
        } catch (e) {
            assert.strictEqual(e.stderr, 'Error: missing configuration file\n');
        }
    });

    it('basic - mode create', async () => {
        const output = await exec(`${wskp} deploy test/fixtures/basic/basic.yaml`)
        assert.strictEqual(output.stdout, 'ok.\n');
        const echo = await ctx.ow.actions.get({ name: 'inline-code/echo' });
        assert.strictEqual(echo.name, 'echo');
    });

    it('basic - mode update', async () => {
        const output = await exec(`${wskp} deploy test/fixtures/basic/basic.yaml -m update`)
        assert.strictEqual(output.stdout, 'ok.\n');
        const echo = await ctx.ow.actions.get({ name: 'inline-code/echo' });
        assert.strictEqual(echo.name, 'echo');
    });

    it('basic - mode create - error', async () => {
        try {
            const output = await exec(`${wskp} deploy test/fixtures/basic/basic.yaml`);
            assert.ok(false);
        } catch (e) {
            assert.ok(true);
        }
    });

});

describe('testing undeploy', function () {
    const ctx = {};
    before(utils.before(ctx));
    after(utils.after(ctx));

    const wskp = './dist/wskp.js'

    it('with no args', async () => {
        try {
            const output = await exec(`${wskp} undeploy`);
            assert.ok(false);
        } catch (e) {
            assert.strictEqual(e.stderr, 'Error: missing configuration file\n');
        }
    });

    it('basic - unmanaged', async () => {
        const output = await exec(`${wskp} deploy test/fixtures/basic/basic.yaml`);
        assert.strictEqual(output.stdout, 'ok.\n');
        const echo = await ctx.ow.actions.get({ name: 'inline-code/echo' });
        assert.strictEqual(echo.name, 'echo');
        const output2 = await exec(`${wskp} undeploy test/fixtures/basic/basic.yaml`);
        assert.strictEqual(output2.stdout, 'ok.\n');
        try {
            const echo2 = await ctx.ow.actions.get({ name: 'inline-code/echo' });
            assert.ok(false);
        } catch (e) {
            assert.strictEqual(e.statusCode, 404)
        }

    });


}); 