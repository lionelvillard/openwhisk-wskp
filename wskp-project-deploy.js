#!/usr/bin/env node
const program = require('commander-multi')
const deployer = require('@openwhisk-libs/deploy')
const chalk = require('chalk')
const fs = require('fs-extra')
const utils = require('./libs/utils')

console.log(`${chalk.yellow('Warning:')} experimental feature`)

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
    const mode = options.mode || 'create'

    const ow = utils.initOW(options)

    return deployer.deploy(ow, {
        basePath: '.',
        cache: '.openwhisk',
        location: file,
        logger_level: logging,
        force: mode === 'update'
    })
}

const deploy = program.arguments('<openwhisk.yml>')
utils.addOptions(deploy, utils.options.GLOBAL)

deploy.option('-m, --mode [mode]', 'deployment mode (create|update) [create]', /^(create|update)$/i)
    .option('-v, --logging [level]', 'logging level (debug|off) [off]', /^(debug|off)$/i)
    .action((file, options) => {
        apply(file, options)
    })

program.parse(process.argv)