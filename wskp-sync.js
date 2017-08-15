#!/usr/bin/env node
const wske = require('@openwhisk-libs/wsk')
const chalk = require('chalk')

const sync = async () => {
    const conflicts = await wske.sync()
    console.log(conflicts)
}

sync()