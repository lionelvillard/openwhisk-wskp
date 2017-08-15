#!/usr/bin/env node
const program = require('commander-multi')

program
    .usage('<command> [options]')
    .command('list', 'get the list of environments')
    .command('set', 'set the current environment')
    .parse(process.argv)
