#!/usr/bin/env node
const program = require('commander-multi')
const wske = require('openwhisk-deploy')

program
    .arguments('<envname>')
    .parse(process.argv)
 
const run = async () => {
    if (program.args.length === 0) {
        console.error('missing environment name')
        process.exit(1)
    }
    if (program.args.length > 1) {
        console.log('extraneous arguments are ignored')
    }
    const envname = program.args[0]
    const changed = await wske.env.setEnvironment(envname)
    if (!changed) {
        console.error(`${envname} does not exist`)
    }
}

run()