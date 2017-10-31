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
        const output = await exec(`${wskp} env list openwhisk.yml`, { cwd });
        assert.ok(output.stdout.includes('dev'));
    });

    it('env set test', async () => {
        const output = await exec(`${wskp} env set test openwhisk.yml`, { cwd });
        assert.strictEqual(output.stdout, 'ok.\n');
    });

    it('env set invalid environment name', async () => {
        try {
            const output = await exec(`${wskp} env set invalidenv openwhisk.yml`, { cwd });
            assert.ok(false);
        } catch (e) {
            assert.strictEqual(e.stderr, 'error: Error: environment invalidenv does not exist\n');
        }
    });
});

describe('testing deploy', function () {
    const ctx = {};
    before(utils.before(ctx));
    after(utils.after(ctx));

    const wskp = '../../../dist/wskp.js';
    const cwd = 'test/fixtures/basic/';
    
    it('with no args', async () => {
        try {
            const output = await exec(`${wskp} deploy`, { cwd })
            assert.ok(false);
        } catch (e) {
            assert.strictEqual(e.stderr, 'error: app.yml does not exists\n');
        }
    });

    it.skip('basic - mode create', async () => {
        await exec(`${wskp} env set dev basic.yaml`, { cwd });
        await exec(`${wskp} wipe -f`, { cwd });

        const output = await exec(`${wskp} deploy basic.yaml`, { cwd });
        const echo = await exec(`${wskp} action get inline-code/echo`, { cwd });
        assert.ok(echo);
        assert.ok(echo.stdout);
        assert.ok(echo.stdout.includes('inline-code/echo'));
        assert.ok(echo.stdout.includes('params'));
    });

    it.skip('basic - mode update', async () => {
        const output = await exec(`${wskp} deploy basic2.yaml -m update`, { cwd });
        const echo = await exec(`${wskp} action get inline-code/echo`, { cwd });
        assert.ok(echo);
        assert.ok(echo.stdout);
        assert.ok(echo.stdout.includes('params2'));
    });

    it('basic - mode create - error', async () => {
        try {
            const output = await exec(`${wskp} deploy basic.yaml`, { cwd });
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

    const wskp = '../../../dist/wskp.js';
    const cwd = 'test/fixtures/basic/';

    it('with no args', async () => {
        try {
            const output = await exec(`${wskp} undeploy`, { cwd });
            assert.ok(false);
        } catch (e) {
           // assert.strictEqual(e.stderr, 'error: missing configuration file\n');
        }
    });

    it('basic - managed', async () => {
        await exec(`${wskp} env set dev basic.yaml`, { cwd });
        await exec(`${wskp} wipe -f`, { cwd });

        const output = await exec(`${wskp} deploy basic.yaml`, { cwd });
        const echo = await exec(`${wskp} action get inline-code/echo`, { cwd });
        assert.ok(echo);
        assert.ok(echo.stdout);
        assert.ok(echo.stdout.includes('inline-code/echo'));
        const output2 = await exec(`${wskp} undeploy basic.yaml`, { cwd });
        try {
            const echo2 = await exec(`${wskp} action get inline-code/echo`, { cwd });
            assert.ok(false);
        } catch (e) {
            assert.ok(e.stderr.includes('requested resource does not exist'));
        }

    });


}); 