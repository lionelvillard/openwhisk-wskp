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
const pkg = require('../package.json');

const version = pkg.engines.node;
if (!semver.satisfies(process.version, version)) {
    console.log(`Required node version ${version} not satisfied with current version ${process.version}.`);
    process.exit(1);
}

if (!process.env.WSKP_NO_CHECK_UPDATE) {
    updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 }).notify();
}

const extensions = ['--help', '-V', '--version', '-h', 'deploy', 'wipe', 'undeploy', 'refresh', 'update', 'env', 'yo']

async function run() {
    const argv = minimist(process.argv.slice(2));

    if (argv.help && argv._.length === 0) {
        await help();
    }

    if (process.argv.length > 2 && !extensions.includes(process.argv[2])) {
        utils.spawnWskAndExit(process.argv[2], process.argv.slice(3))
        return
    }

    const cmd = argv._.shift();

    switch (cmd) {
        case 'deploy':
            await deploy(argv);
            break;
        case 'undeploy':
            await undeploy(argv);
            break;
        case 'wipe':
            await wipe(argv);
            break;
        case 'refresh':
            await refresh(argv);
            break;
        case 'env':
            await env(argv);
            break;
        case 'yo':
            await yo(argv);
            break;
        default:
            await help();
    }
}

async function deploy(argv) {
    if (argv.help) {
        helpCommand('wskp deploy <config.yml>', ['-m, --mode [mode]', 'deployment mode (create|update) [create]']);
    }
    const file = argv._.shift();

    if (!file) {
        error('Error: missing configuration file');
    }
    checkExtraneous(argv);

    if (! await fs.exists(file)) {
        console.log(error(`Error: ${file} does not exists`))
        process.exit(1)
    }

    const logger_level = getLoggerLevel(argv);
    const global = getGlobalFlags(argv);
    const mode = consume(argv, ['m', 'mode']) || 'create';
    checkExtraneousFlags(argv);

    try {
        const ow = wskd.auth.initWsk(global);

        await wskd.deploy({
            ow,
            basePath: '.',
            cache: '.openwhisk',
            location: file,
            logger_level,
            force: mode === 'update'
        });
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
        error('Error: missing configuration file');
    }
    checkExtraneous(argv);
    const logger_level = getLoggerLevel(argv);
    const global = getGlobalFlags(argv);
    checkExtraneousFlags(argv);

    try {

        const ow = wskd.auth.initWsk(global)
        await wskd.undeploy.apply({
            ow,
            basePath: '.',
            cache: '.openwhisk',
            location: file,
            logger_level
        });
        console.log(chalk.green('ok.'));
    } catch (e) {
        console.log(chalk.red(`not ok: ${e}`));
    }
}

async function wipe(argv) {
    if (argv.help) {
        helpCommand('wskp wipe');
    }
    checkExtraneous(argv);
    const logger_level = getLoggerLevel(argv);
    const global = getGlobalFlags(argv);
    checkExtraneousFlags(argv);

    if (readline.keyInYN(`${chalk.red('DANGER ZONE')}: are you sure you want to delete *all* deployed OpenWhisk entities?`)) {
        try {
            const ow = await wskd.auth.initWsk(global);

            await wskd.undeploy.apply({ ow, logger_level });
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
    if (format.format === 'bash')
        target = 2;

    try {
        const ow = wskd.auth.initWsk(global)

        const output = await wskd.refresh.apply({
            ow,
            logger_level,
            target
        });

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
        helpCommand('wskp env set <env>');
    }
    const env = argv._.shift();
    if (!env) {
        error('Error: missing configuration file');
    }
    checkExtraneous(argv);
    const logger_level = getLoggerLevel(argv);
    const global = getGlobalFlags(argv);
    checkExtraneousFlags(argv);

    const changed = await wskd.env.setEnvironment(env)
    if (!changed) {
        error(`${env} does not exist`)
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

    const envs = await wskd.env.getEnvironments()
    envs.forEach(item => console.log(item))
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
        key: consume(argv, ['key'])
    }
}

function error(msg: string) {
    console.error(chalk.red(msg));
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
        wskhelp = await utils.execWsk('', ['--help']);
        wskhelp = wskhelp.replace('wsk', 'wskp');
        patch = wskhelp.indexOf('Flags') - 2;
        console.log(wskhelp.slice(0, patch));
    } catch (e) {
        // wsk not found... ignore
    }


    console.log('  env              work with environment');
    console.log('  env list         list environments');
    console.log('  env set          set current environment');
    console.log('  deploy           apply deployment configuration');
    console.log('  undeploy         remove deployed resources in configuration');
    console.log('  wipe             remove deployed resources in namespace');
    console.log('  import           update deployment configuration with deployed resources');
    console.log('  yo               generate stubs');
    console.log('  yo project       initialize openwhisk project');
    console.log('  yo action        initialize openwhisk action');

    if (wskhelp)
        console.log(wskhelp.slice(patch));

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
}

run();
