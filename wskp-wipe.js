#!/usr/bin/env node
const program = require('commander-multi')
const wskd = require('@openwhisk/deploy')
const chalk = require('chalk')
const fs = require('fs-extra')
const utils = require('./libs/utils')
const readline = require('readline-sync');

const apply = async (options) => {
    if (readline.keyInYN(`${chalk.red('DANGER ZONE')}: are you sure you want to delete *all* deployed OpenWhisk entities?`)) {
        let logger_level = options.logging || 'off';
        logger_level = logger_level.toUpperCase();
        const ow = await wskd.auth.initWsk(options);

        try {
            await wskd.undeploy.apply({ ow, logger_level });
            console.log(chalk.green('ok.'));
        } catch (e) {
            console.log(chalk.red(`not ok: ${e}`));
        }
    }
}

const wipe = program.description('remove all OpenWhisk managed and unmanaged entities from the project namespace(s)')

utils.addOptions(wipe, utils.options.GLOBAL)

wipe.option('-v, --logging [level]', 'logging level (debug|off) [off]', /^(debug|off)$/i)
    .parse(process.argv)

apply(program);