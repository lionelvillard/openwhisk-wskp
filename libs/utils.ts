/*
 * Copyright 2017 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
const fs = require('fs')
const path = require('path')
const expandHomeDir = require('expand-home-dir')
const { spawn, exec } = require('child_process')
const openwhisk = require('openwhisk')
const wskd = require('openwhisk-deploy')
const pkg = require('../../package.json');
const Configstore = require('configstore');

import * as chalk from 'chalk';

const conf = new Configstore(pkg.name, { 'bx': false });

// Apply configuration to wsk args
export function fixupWskArgs(argv, variables) {
    if (!argv.includes('-u') && !argv.includes('--auth') && variables.auth)
        argv.push('-u', variables.auth)
    if (!argv.includes('--apihost') && variables.apihost)
        argv.push('--apihost', variables.apihost)
    if (!argv.includes('-i') && variables.ignore_certs)
        argv.push('-i')
}

export function prepareWskCommand(wskcmd, argv, options = {}) {
    const bx = conf.get('bx') ? 'bx ' : '';
    const variables = wskd.env.resolveVariables({}, options)

    if (wskcmd !== 'property') {
        fixupWskArgs(argv, variables)
    }

    let wskConfigFile = ''
    if (wskcmd === 'property') {
        const wskPropsFile = wskd.env.getWskPropsFile();
        if (wskPropsFile)
            wskConfigFile = `WSK_CONFIG_FILE=${wskPropsFile}`
    }

    const args = argv.map(item => `'${item.replace(/'/, `\\'`)}'`).join(' ')
    return `${wskConfigFile} ${bx} wsk ${wskcmd} ${args}`
}

export function spawnWskAndExit(wskcmd, argv, options = {}) {
    // handle wskp property set bx 
    if (argv.length >= 3 && argv[0] === 'set' && argv[1] === 'bx') {
        conf.set('bx', argv[2] === 'true' || argv[2] === '1');
        process.exit(0);
    }

    const fullCmd = prepareWskCommand(wskcmd, argv, options)

    if (process.env.WSKP_DEBUG)
        console.error(`spawn ${fullCmd}`)

    const proc = spawn(fullCmd, { shell: true, stdio: 'inherit' })

    proc.on('close', code => {
        if (wskcmd === 'property') {
            if (argv.length >= 1 && argv[0] === 'get') {
                console.log(`wskp use bx             ${chalk.bold(conf.get('bx'))}`);
            }
        }
        process.exit(code)
    })
}

export function execWsk(wskcmd, argv, options = {}): Promise<string> {
    return new Promise((resolve, reject) => {
        const fullCmd = prepareWskCommand(wskcmd, argv, options)

        if (process.env.WSKP_DEBUG)
            console.error(`exec ${fullCmd}`)

        exec(fullCmd, (error, stdout, stderr) => {
            if (error) {
                console.log(stdout)
                console.error(stderr)
                reject(error)
            } else {
                resolve(stdout)
            }
        })
    })
}

// transform options of the form --flag K V to --flag K=V 
export function fixupKeyValue(args: string[]): string[] {
    const r = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-p' || arg === '--param' || arg === '-P' || arg === '--param-file') {
            if (args.length > i + 2) {
                r.push(arg);
                r.push(`${args[++i]}=${args[++i]}`);
            } else
                throw `${chalk.red('error:')} Failed to parse arguments: The parameter arguments are invalid: Arguments for '${arg}' must be a key/value pair`;
        } else {
            r.push(arg);
        }
    }
    return r;
}

// ---- options

export const options = {
    GLOBAL: ['apihost', 'auth', 'cert', 'debug', 'insecure', 'verbose']
}

const wskoptions = {
    apihost: { flags: '--apihost <host>', desc: 'whisk API host' },
    auth: { flags: '-u, --auth <key>', desc: 'authorization key' },
    cert: { flags: '--cert <string>', desc: 'client cert' },
    insecure: { flags: '-i, --insecure', desc: 'bypass certificate checking' },
    debug: { flags: '-d, --debug', desc: 'debug level output' },
    verbose: { flags: '-v', desc: 'verbose level output' },
}

export function addOptions(command, options) {
    for (const name of options) {
        const option = wskoptions[name]
        if (option)
            command = command.option(option.flags, option.desc)
    }
    return command;
}
