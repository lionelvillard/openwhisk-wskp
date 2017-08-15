#!/usr/bin/env node
const chalk = require('chalk')
const { exec } = require('child-process-promise')
const  pkg = require('./package.json');

const update = async () => {
    //console.log('Updating...')
    // const version = await exec('npm show wskp version')
    // if (version && version !== pkg.version) {
    //     console.log(chalk.yellow('A new version of this CLI is available. Updating...'))
    //     await exec('npm update wskp -g')
    // } else {
         console.log('wskp is up to date')
    // }
}

update()