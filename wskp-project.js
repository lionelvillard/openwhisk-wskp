#!/usr/bin/env node
const program = require('commander-multi')
const utils = require('./libs/utils')

const cmds = program
    .usage('<command> [options]')
    .description('work with project')

utils.addOptions(cmds, utils.options.GLOBAL)

cmds.command('refresh', 'synchronize project with deployed resources')
    .command('sync', 'synchronize project with local resources') // TODO: or remote
    .command('deploy', 'deploy project')
    .parse(process.argv)
