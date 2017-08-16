#!/usr/bin/env node
const wske = require('@openwhisk/wsk')
const chalk = require('chalk')

console.log(`${chalk.yellow('Warning:')} experimental feature.
`)
const sync = async () => {
    const conflicts = await wske.sync()
    console.log(conflicts)
}

sync()