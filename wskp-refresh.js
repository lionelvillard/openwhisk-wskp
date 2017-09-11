#!/usr/bin/env node
const program = require('commander-multi')
const wskd = require('@openwhisk/deploy')
const openwhisk = require('openwhisk')
const utils = require('./libs/utils.js')
const chalk = require('chalk')
const yaml = require('yamljs')

//console.log(`${chalk.yellow('Warning:')} experimental feature`)

async function apply(options) {
    let logging = options.logging || 'off';
    logging = logging.toUpperCase();

    let target = 3;
    if (options.format === 'bash')
    target = 2;

    const ow = wskd.auth.initWsk(options)
    try {
        const output = await wskd.refresh.apply({
            ow,
            logger_level: logging,
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

const refresh = program
    .option('-f <format>, --format <format>]', 'output format (bash|yaml) [yaml], /^(bash|yaml)$/i');

utils.addOptions(refresh, utils.options.GLOBAL);

refresh.parse(process.argv)

apply(program)