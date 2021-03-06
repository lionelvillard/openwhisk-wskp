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
const pkg = require('../../package.json');
const Configstore = require('configstore');

import * as chalk from 'chalk';
import * as wskd from 'openwhisk-deploy';
import * as parser from 'properties-parser';

const conf = new Configstore(pkg.name, { 'bx': false });


export async function prepareWskCommand(wskcmd, argv, options = {}) {
    let bx = conf.get('bx') ? 'bx ' : '';
    
    if (wskcmd) {        
        const envname = extractEnv(argv);
        bx = envname ? bx : '';
        const config = wskd.init.newConfig(envname ? 'app.yml': '', '', envname);
        config.skipPhases = ['validation'];
        try {
            await wskd.init.init(config);
            const wskPropsFile = await wskd.env.getWskPropsFile(config);
            let wskConfigFile = wskPropsFile ? `WSK_CONFIG_FILE=${wskPropsFile}` : '';
            
            if (envname && wskPropsFile) {
                const props = parser.read(wskPropsFile);
                if (props.BLUEMIX_ORG && props.BLUEMIX_SPACE) {
                    wskConfigFile += ` BLUEMIX_HOME=${path.join(config.cache, '.bluemix', 'api.ng.bluemix.net', props.BLUEMIX_ORG, props.BLUEMIX_SPACE)}`;
                }
            }

            const args = argv.map(item => `'${item.replace(/'/, `\\'`)}'`).join(' ');            
            config.clearProgress();
            return `${wskConfigFile} ${bx} wsk ${wskcmd} ${args}`;
        } catch (e) {
            config.clearProgress();
            console.error(e);
            process.exit(1);
        }
    }
    return `${bx} wsk ${argv}`;
}

export async function spawnWskAndExit(wskcmd, argv, options = {}) {
    // handle wskp property set bx 
    if (argv.length >= 3 && argv[0] === 'set' && argv[1] === 'bx') {
        conf.set('bx', argv[2] === 'true' || argv[2] === '1');
        process.exit(0);
    }

    const fullCmd = await prepareWskCommand(wskcmd, argv, options)

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

export async function execWsk(wskcmd, argv, options = {}): Promise<string> {
    const fullCmd = await prepareWskCommand(wskcmd, argv, options)

    if (process.env.WSKP_DEBUG)
        console.error(`exec ${fullCmd}`)

    return new Promise<string>((resolve, reject) => {
        exec(fullCmd, (error, stdout, stderr) => {
            if (error) {
                console.log(stdout);
                console.error(stderr);
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
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

function extractEnv(argv) {
    let envname;
    const envIdx = argv.indexOf('-e');
    if (envIdx >= 0) {
        if (envIdx + 1 >= argv.length)
            throw `expecting envname after -e`;
        envname = argv[envIdx + 1];
        
        delete argv[envIdx];
        delete argv[envIdx + 1];
    }
    return envname;
}