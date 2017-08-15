#!/usr/bin/env node
const program = require('commander-multi')
const chalk = require('chalk')
const wske = require('@openwhisk-libs/wsk')
const utils = require('./libs/utils')

const extensions = ['--help','-V', '--version', '-h', 'refresh','update','env','sync','deploy']

const run = async () => {
    //if (await wske.update()) {
    //    console.log(chalk.yellow(`A new version fo this CLI is available there: https://console.bluemix.net/openwhisk/learn/cli`))
    //}

    if (process.argv.length > 2 && !extensions.includes(process.argv[2])) {
        utils.spawnWskAndExit(process.argv[2], process.argv.slice(3))
        return
    }

    program.on('--help', () => {
        console.log('')
        console.log('  The api host and authorization key are individually determined in this order:')
        console.log('')
        console.log(`    1. ${chalk.bold('-u auth')} and ${chalk.bold('--apihost')}`)
        console.log('    2. $WSK_CONFIG_FILE')
        console.log('    3. .wskprops in the current directory. If not found, look in the parent directory, until reaching the home directory')
        console.log('')
        console.log('')
    })

    program
        .version('0.1.0')
        .usage('<command> [options]')
        .description('Enhanced Apache OpenWhisk CLI')
        .command('refresh', 'synchronize whisk configuration files with deployed entities')
        .command('update', 'check for updates')
        .command('env', 'work with environments')
        .command('sync', 'synchronize whisk configuration files with local resources') // TODO: or remote
        .command('deploy', 'apply whisk configuration files')
        //.command('cache', 'manage the local cache') Might be useful for analysis.  
        .parse(process.argv)
}

run()
