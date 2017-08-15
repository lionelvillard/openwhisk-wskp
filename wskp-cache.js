#!/usr/bin/env node
const program = require('commander-multi')
const expand = require('expand-home-dir')
const fs = require('fs-extra')
const { exec } = require('child-process-promise')
const path = require('path')
const utils = require('./libs/utils')

const cacheRoot = expand('~/.openwhisk/cache')
const tsfile = path.join(cacheRoot, 'ts.txt')
const cachefile = path.join(cacheRoot, 'activations')

fs.mkdirpSync(cacheRoot)

// --- sync

const doSync = async () => {
    let since
    if (await fs.exists(tsfile)) {
        since = Number.parseInt(await fs.readFile(tsfile))
    } else
        since = new Date().getTime() - (30 * 86400000) // one day worth of activations 
    let ts 
    while (1) {
        ts = new Date().getTime()
        const activations = await exec(`wskp activation list --since ${since} -l 200 | sed -e "1d" | tee -a ${cachefile}`)
        if (activations.stdout && activations.stdout !== '') {
            const lines = activations.stdout.split(/[\r\n]/)
            if (lines.length === 201) {
                // missing somes...
                const id = lines[0].split(' ')[0]
                const last = await exec(`wskp activation get ${id} | sed -e "1d"`)
                if (last.stdout) {
                    since = JSON.parse(last.stdout).start
                } else break
            } else break
        } else break
    }

    await fs.writeFile(tsfile, ts.toString())
    
}

program
    .command('sync')
    .description('synchronize local cache')
    .option('-w, --watch', 'watch for remote changes')
    .action(() => {
        doSync()
    })

program.parse(process.argv)