#!/usr/bin/env node
const program = require('commander-multi')
const wske = require('@openwhisk-libs/wsk')

program
    .command('list', 'get the list of environments')
    .command('set', 'set the current environment')
    .parse(process.argv)
 