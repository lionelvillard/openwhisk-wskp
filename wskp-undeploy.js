#!/usr/bin/env node
const program = require('commander-multi')
const wskd = require('@openwhisk/deploy')
const chalk = require('chalk')
const fs = require('fs-extra')
const utils = require('./libs/utils')

//console.log(`${chalk.yellow('Warning:')} experimental feature`)

if (process.argv.length === 2) {
    console.error(`${chalk.red('error:')} missing configuration file`)
    process.exit(1)
}

const apply = async (file, options) => {
    if (! await fs.exists(file)) {
        console.log(error(`Error: ${file} does not exists`))
        process.exit(1)
    }

    let logging = options.logging || 'off'
    logging = logging.toUpperCase()

    const ow = wskd.auth.initWsk(options)
    try {
        await wskd.undeploy.apply({
            ow,
            basePath: '.',
            cache: '.openwhisk',
            location: file,
            logger_level: logging
        });
        console.log(chalk.green('ok.'));
    } catch (e) {
        console.log(chalk.red(`not ok: ${e}`));
    }
}

const undeploy = program.arguments('<openwhisk.yml>')
utils.addOptions(undeploy, utils.options.GLOBAL)

undeploy.option('-v, --logging [level]', 'logging level (debug|off) [off]', /^(debug|off)$/i)
    .action((file, options) => {
        apply(file, options)
    })

program.parse(process.argv)