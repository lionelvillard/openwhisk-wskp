#!/usr/bin/env node
const program = require('commander-multi')
const chalk = require('chalk')
const wske = require('@openwhisk/deploy')
const utils = require('./libs/utils')
const pkg = require('./package.json')

const extensions = ['--help', '-V', '--version', '-h', 'deploy', 'wipe', 'undeploy', 'refresh', 'update', 'env', 'yo']

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

    const cmds = program
        .version(pkg.version)
        .usage('<command> [options]')

    utils.addOptions(cmds, utils.options.GLOBAL)

    cmds.description('Apache OpenWhisk CLI with extensions')
        .command('bluemix', 'bluemix integration')
        .command('action', 'work with actions')
        .command('activation', 'work with activations')
        .command('package', 'work with packages')
        .command('rule', 'work with rules')
        .command('trigger', 'work with triggers')
        .command('sdk', 'work with the sdk')
        .command('property', 'work with whisk properties')
        .command('namespace', 'work with namespaces')
        .command('list', 'list entities in the current namespace')
        .command('api-experimental', 'work with APIs (experimental)')
        .command('api', 'work with APIs')
        .command('env', 'work with environments')
        .command('deploy (experimental)', 'deploy managed entities to OpenWhisk')
        .command('undeploy (experimental)', 'undeploy all managed entities')
        .command('wipe', 'remove all OpenWhisk managed and unmanaged entities from the project namespace(s)')
        .command('refresh', 'update the deployment configuration files with the deployed entities')
        .command('yo', 'generate stubs')
        .command('update', 'check for updates')
        
        //.command('cache', 'manage the local cache') Might be useful for analysis.  
        .parse(process.argv)
}

run()
