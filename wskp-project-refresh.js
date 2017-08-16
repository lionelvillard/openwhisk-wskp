#!/usr/bin/env node
const program = require('commander-multi')
const wske = require('@openwhisk/wsk')
const openwhisk = require('openwhisk')
const utils = require('./libs/utils.js')

console.log(`${chalk.yellow('Warning:')} experimental feature`)

program
    .option('-f <format>, --format <format>]', 'output format (bash|json) [json], /^(bash|json)$/i')
    .parse(process.argv)

let converter
if (program.format === 'bash')
    converter = wske.toBash

const vars = utils.resolveVariables()

const ow = openwhisk({ api_key: vars.auth, apihost: vars.apihost})

wske.refresh(ow, converter)
    .then(script => console.log(script))