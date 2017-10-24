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
const fs = require('fs-extra')
const openwhisk = require('openwhisk')
const expandHomeDir = require('expand-home-dir')
const path = require('path')
const wskd = require('openwhisk-deploy')
const Configstore = require('configstore');

const conf = new Configstore('openwhisk-wskp', { 'bx': true });
conf.set('bx', true);

const before = ctx => async () => {
    fs.mkdirsSync('.tests');
    ctx.cacheDir = await fs.mkdtemp('.tests/test');
}
exports.before = before;

const after = ctx => () => {
    if (ctx.cacheDir) {
        fs.removeSync(ctx.cacheDir);
    }
}
exports.after = after;


const delay = ms => new Promise(resolve => setTimeout(() => resolve(), ms));
exports.delay = delay;
