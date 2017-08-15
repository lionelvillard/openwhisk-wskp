#!/usr/bin/env node
const program = require('commander-multi')
const wske = require('@openwhisk-libs/wsk')

program
    .parse(process.argv)
 
const run = async () => {
    const envs = await wske.env.getEnvironments()
    envs.forEach(item => console.log(item))
}

run()