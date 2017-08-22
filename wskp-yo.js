#!/usr/bin/env node
const program = require('commander-multi')
const utils = require('./libs/utils')
const chalk = require('chalk')
const wsk = require('@openwhisk/wsk')

const cmds = program
    .usage('<command> [options]')
    .description('generate stubs')


// --- Generate project

program.command('project')
    .description('generate project')
    .action(() => {
        wsk.yo.run('app')
    })

// --- Generate action

program.command('action')
    .description('generate action')
    .action(() => {
        wsk.yo.run('action')
    })

if (process.argv.length === 2) {
    program.help()
}

program.parse(process.argv)