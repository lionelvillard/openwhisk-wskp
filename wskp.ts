#!/usr/bin/env node
import * as chalk from 'chalk';
import * as utils from './libs/utils';
import * as minimist from 'minimist';
import * as fs from 'fs-extra';
import * as wskd from 'openwhisk-deploy';
import * as readline from 'readline-sync';
import * as yaml from 'yamljs';
import { exec } from 'child-process-promise';
import * as semver from 'semver';
import * as updateNotifier from 'update-notifier';
import * as getPort from 'get-port';
import * as rp from 'request-promise';
import * as path from 'path';
const pkg = require('../package.json');

const version = pkg.engines.node;
if (!semver.satisfies(process.version, version)) {
    console.log(`Required node version ${version} not satisfied with current version ${process.version}.`);
    process.exit(1);
}

if (!process.env.WSKP_NO_CHECK_UPDATE) {
    updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 }).notify();
}

const extensions = ['--help', '-V', '--version', '-h', 'deploy', 'wipe', 'undeploy', 'refresh', 'update', 'env', 'yo', 'start', 'action', 'version'];

async function run() {
    try {
        const argv = minimist(utils.fixupKeyValue(process.argv.slice(2)));

        if (argv.help && argv._.length === 0) {
            await help();
        }

        if (process.argv.length > 2 && !extensions.includes(process.argv[2])) {
            return await utils.spawnWskAndExit(process.argv[2], process.argv.slice(3));
        }

        const cmd = argv._.shift();

        switch (cmd) {
            case 'action':
                return action(argv);
            case 'deploy':
                return deploy(argv);
            case 'undeploy':
                return undeploy(argv);
            case 'wipe':
                return wipe(argv);
            case 'refresh':
                return refresh(argv);
            case 'env':
                return env(argv);
            case 'yo':
                return yo(argv);
            case 'start':
                return start(argv);
            case 'version':
                return changeVersion(argv);

            default:
                return help();
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

async function action(argv) {
    if (argv.help) {
        return await utils.spawnWskAndExit(process.argv[2], process.argv.slice(3));
    }

    const cmd = argv._.shift();
    if (cmd === 'invoke') {
        return actionInvoke(argv);
    }
    return await utils.spawnWskAndExit(process.argv[2], process.argv.slice(3));
}

async function actionInvoke(argv) {
    if (argv.help) {
        return await utils.spawnWskAndExit(process.argv[2], process.argv.slice(3));
    }

    const actioname = argv._.shift();
    if (!actioname) {
        error('Invalid argument(s). An action name is required.');
    }
    const logger_level = getLoggerLevel(argv);
    const global = getGlobalFlags(argv);
    const debugport = consume(argv, ['debugport']) || false;
    const blocking = consume(argv, ['b', 'blocking']) || false;
    const result = consume(argv, ['r', 'result']) || false;
    const p = consume(argv, ['p']);
    const param = consume(argv, ['param']);
    const body = {};
    if (p) {
        p.forEach(kv => {
            const eqi = kv.indexOf('=');
            body[kv.substring(0, eqi)] = kv.substr(eqi + 1);
        });
    }
    if (param) {
        param.forEach(kv => {
            const eqi = kv.indexOf('=');
            body[kv.substring(0, eqi)] = kv.substr(eqi + 1);
        });
    }

    const config: wskd.types.Config = {};

    const vars = await wskd.env.resolveVariables(config, global);
    const wskpropPath = await wskd.env.getWskPropsFile(config);
    const wskpproject = wskpropPath ? path.dirname(path.resolve(wskpropPath)) : false;

    const coloni = vars.auth.indexOf(':');
    const user = vars.auth.substring(0, coloni);
    const pass = vars.auth.substring(coloni + 1);

    const { namespace, pkg, name } = wskd.names.parseQName(wskd.names.resolveQName(actioname, '_', ''));
    const uri = `https://${vars.apihost}/api/v1/namespaces/${namespace}/actions${pkg ? `/${pkg}` : ''}/${name}`;
    try {
        const response = await rp({
            method: 'POST',
            uri,
            auth: {
                user,
                pass
            },
            qs: {
                blocking,
                result,
                debugport
            },
            json: true,
            strictSSL: !global.insecure, // TODO: fix bug in wskd.auth.
            body
        });
        console.log(JSON.stringify(response, null, 2));
    } catch (e) {
        error(e.message);
    }
}

async function deploy(argv) {
    if (argv.help) {
        helpCommand('wskp deploy <project.yml>', ['-m, --mode [mode]     deployment mode (create|update) [create]',
            '-e, --env  [envname]  targeted environment name. Default to <current>']);
    }
    const file = argv._.shift();

    if (!file) {
        error('missing configuration file');
    }
    checkExtraneous(argv);

    if (! await fs.pathExists(file)) {
        console.log(error(`${file} does not exists`))
        process.exit(1)
    }

    const logger_level = getLoggerLevel(argv);
    const global = getGlobalFlags(argv);
    const mode = consume(argv, ['m', 'mode']) || 'create';
    checkExtraneousFlags(argv);

    try {
        const config = wskd.init.newConfig(file, logger_level, global.env);
        config.force = mode === 'update';
        config.flags = global;

        await wskd.init.init(config);
        await wskd.deploy.apply(config);
        console.log(chalk.green('ok.'));
    } catch (e) {
        console.log(chalk.red(`not ok: ${e}`));
    }
}

async function undeploy(argv) {
    if (argv.help) {
        helpCommand('wskp undeploy <config.yml>');
    }
    const file = argv._.shift();
    if (!file) {
        error('missing configuration file');
    }
    checkExtraneous(argv);
    const logger_level = getLoggerLevel(argv);
    const global = getGlobalFlags(argv);
    checkExtraneousFlags(argv);

    try {
        const config: wskd.types.Config = {
            basePath: '.',
            cache: '.openwhisk',
            location: file,
            logger_level
        }

        await wskd.env.initWsk(config, global);
        await wskd.undeploy.apply(config);
        console.log(chalk.green('ok.'));
    } catch (e) {
        console.log(chalk.red(`not ok: ${e}`));
    }
}

async function wipe(argv) {
    if (argv.help) {
        helpCommand('wskp wipe', ['-f, --force']);
    }
    checkExtraneous(argv);
    const logger_level = getLoggerLevel(argv);
    const global = getGlobalFlags(argv);
    const force = consume(argv, ['f', 'force']);
    checkExtraneousFlags(argv);

    if (force || readline.keyInYN(`${chalk.red('DANGER ZONE')}: are you sure you want to delete ${chalk.bold('all')} deployed OpenWhisk entities?`)) {
        try {
            const config: wskd.types.Config = { logger_level };
            await wskd.env.initWsk(config, global);

            await wskd.undeploy.apply(config);
            console.log(chalk.green('ok.'));
        } catch (e) {
            console.log(chalk.red(`not ok: ${e}`));
        }
    }
}

async function refresh(argv) {
    if (argv.help) {
        helpCommand('wskp refresh', ['-f <format>, --format <format>]', 'output format (bash|yaml) [yaml]']);
    }
    checkExtraneous(argv);
    const logger_level = getLoggerLevel(argv);
    const format = consume(argv, ['f', 'format']);
    const global = getGlobalFlags(argv);
    checkExtraneousFlags(argv);

    let target = 3;
    if (format === 'bash')
        target = 2;

    try {
        const config: wskd.refresh.Config = { logger_level, target };
        await wskd.env.initWsk(config, global);
        const output = await wskd.refresh.apply(config);

        if (target === 3) {
            console.log(yaml.stringify(output, 16, 2));
        } else {
            console.log(output);
        }
    } catch (e) {
        console.log(chalk.red(`not ok: ${e}`));
    }
}

async function env(argv) {
    const cmd = argv._.shift();

    switch (cmd) {
        case 'set':
            await envSet(argv);
            break;
        case 'list':
            await envList(argv);
            break;
        default:
            await help();
    }
}

async function envSet(argv) {
    if (argv.help) {
        helpCommand('wskp env set env [project.yml]');
    }
    const env = argv._.shift();
    if (!env)
        error('missing environment');

    const location = argv._.shift(); // might be null

    checkExtraneous(argv);
    const logger_level = getLoggerLevel(argv);
    const global = getGlobalFlags(argv);
    checkExtraneousFlags(argv);

    const config = wskd.init.newConfig(location, logger_level, env);

    try {
        await wskd.init.init(config);
        await wskd.env.setEnvironment(config);
        console.log(chalk.green('ok.'));
    } catch (e) {
        config.setProgress('');
        error(e);
    }
}

async function envList(argv) {
    if (argv.help) {
        helpCommand('wskp env list');
    }

    checkExtraneous(argv);
    const logger_level = getLoggerLevel(argv);
    const global = getGlobalFlags(argv);
    checkExtraneousFlags(argv);

    const config = wskd.init.newConfig(null, logger_level);
    await wskd.init.init(config);

    const envs: any = await wskd.env.getEnvironments(config);
    console.log(chalk.bold('Name / Writable'))
    envs.forEach(item => console.log(`${item.name} / ${item.writable ? 'true' : 'false'}`));
}

async function yo(argv) {
    const cmd = argv._.shift();

    switch (cmd) {
        case 'project':
            await wskd.yo.run('app')
            break;
        case 'action':
            await wskd.yo.run('action')
            break;
        default:
            help();
    }
}


async function changeVersion(argv) {
    if (argv.help) {
        helpCommand('wskp version <project.yml> (major | premajor | minor | preminor | patch | prepatch | prerelease)');
    }
    const projectPath = argv._.shift();
    if (!projectPath)
        error('missing configuration file');

    const increment = argv._.shift();
    if (!increment)
        error('missing release type');

    checkExtraneous(argv);
    const logger_level = getLoggerLevel(argv);
    const global = getGlobalFlags(argv);
    checkExtraneousFlags(argv);

    const config = wskd.init.newConfig(projectPath);
    try {

        await wskd.init.init(config);
        wskd.env.incVersion(config, increment);
        console.log(chalk.green('ok.'));
    } catch (e) {
        config.setProgress('');
        error(e);
    }

}


async function start(argv) {
    if (argv.help) {
        helpCommand('wskp start');
    }
    checkExtraneous(argv);
    const logger_level = getLoggerLevel(argv);

    await wskd.controller.init({
        cache: '.openwhisk',
        logger_level
    });

    const port = await getPort({ port: 3000 });

    const server = wskd.controller.start(port);
    console.log(`start listening ${chalk.bold('localhost:' + port)}`);
}

process.on('SIGINT', async () => {
    await wskd.controller.stop();
    process.exit(0);
});

function getLoggerLevel(argv) {
    const verbose = consume(argv, ['v', 'verbose']);
    const debug = consume(argv, ['d', 'debug']);
    if (debug)
        return 'debug';
    if (verbose)
        return 'info';
    return 'off';
}

function getGlobalFlags(argv) {
    return {
        apihost: consume(argv, ['apihost']),
        apiversion: consume(argv, ['apiversion']),
        auth: consume(argv, ['u', 'auth']),
        cert: consume(argv, ['cert']),
        insecure: consume(argv, ['i', 'insecure']),
        key: consume(argv, ['key']),
        env: consume(argv, ['e', 'env'])
    }
}

function error(msg: string) {
    console.error(`${chalk.red('error: ')}${msg}`);
    process.exit(1);
}

function consume(argv, options: string[]) {
    return options.reduce((value, option) => {
        const v = argv[option];
        delete argv[option];
        return value || v;
    }, undefined);
}

function checkExtraneous(argv) {
    if (argv._.length !== 0) {
        console.log(chalk.red(`Extraneous argument(s): ${argv._.join(', ')}`));
        process.exit(1);
    }
}

function checkExtraneousFlags(argv) {
    delete argv._;
    if (Object.keys(argv).length !== 0) {
        console.log(chalk.red(`Extraneous flags(s): ${Object.keys(argv).join(', ')}`));
        process.exit(1);
    }
}

async function help() {
    console.log('Apache OpenWhisk CLI with extensions');

    let wskhelp;
    let patch;
    try {
        wskhelp = await utils.execWsk('', []);
        wskhelp = wskhelp.replace(/wsk/g, 'wskp');
        patch = wskhelp.indexOf('Flags') - 2;
        console.log(wskhelp.slice(0, patch));
    } catch (e) {
        // wsk not found... ignore
    }


    console.log('  env              work with environment');
    console.log('  env list         list environments');
    console.log('  env set          set current environment');
    console.log('  deploy           apply project configuration');
    console.log('  undeploy         remove deployed resources in project configuration');
    console.log('  start            start openwhisk server backed by local project resources');
    console.log('  wipe             remove deployed resources in namespace');
    console.log('  import           update project configuration with deployed resources');
    console.log('  yo               generate stubs');
    console.log('  yo project       initialize openwhisk project');
    console.log('  yo action        initialize openwhisk action');

    if (wskhelp) {
        console.log(wskhelp.slice(patch));
    }

    console.log('')
    console.log('  The location of .wskprops is determined in this order:')
    console.log('')
    console.log('    1. $WSK_CONFIG_FILE')
    console.log('    2. .wskprops in the current directory. If not found, look in the parent directory, until reaching the home directory')
    console.log('')
    console.log('  Each property value stored in .wskprops can be overriden by the CLI flags and then by environment variables.')
    console.log('')

    process.exit(0);
}

async function helpCommand(command: string, flags?: string[]) {
    console.log('Usage:');
    console.log(`  ${command}`);
    console.log('');

    if (flags) {
        console.log('Flags:');
        console.log(flags.join('\n  '));
    }

    await globalFlagsHelp();
    process.exit(0);
}

async function globalFlagsHelp() {
    let wskhelp = await utils.execWsk('', ['--help']);
    wskhelp = wskhelp.replace('wsk', 'wskp');
    const patch = wskhelp.indexOf('Flags') - 2;
    console.log(wskhelp.slice(patch));
    console.log(' -e, --env                  environment name');
}

run();
