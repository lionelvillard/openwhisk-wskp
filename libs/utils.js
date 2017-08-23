/*
 * Copyright 2017 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const fs = require('fs')
const path = require('path')
const expandHomeDir = require('expand-home-dir')
const { spawn, exec } = require('child_process')
const openwhisk = require('openwhisk')

const getWskPropsFile = () => {
    let wskprops = process.env.WSK_CONFIG_FILE
    if (!wskprops || !fs.existsSync(wskprops)) {
        const until = path.dirname(expandHomeDir('~'))
        let current = process.cwd()
        while (current !== '/' && current !== until) {
            wskprops = path.join(current, '.wskprops')

            if (fs.existsSync(wskprops))
                break
            current = path.dirname(current)
        }
    }
    return wskprops
}
exports.getWskPropsFile = getWskPropsFile

const readWskProps = () => {
    const wskprops = getWskPropsFile()
    if (wskprops) {
        const propertiesParser = require('properties-parser')
        try {
            return propertiesParser.read(wskprops)
        } catch (e) {
            return null
        }
    }
    return null
}
exports.readWskProps = readWskProps

// Resolve auth and api host, independently (TODO)
const auth = (options = {}) => {
    if (options.auth)
        return options

    const wskprops = readWskProps()

    if (wskprops) {
        return {
            api_key: wskprops.AUTH,
            apihost: wskprops.APIHOST,
            insecure: wskprops.INSECURE_SSL || false
        }
    }

    return null
}
exports.auth = auth

// Resolve variables by merging command line options with .wskprops content
const resolveVariables = (options = {}) => {
    const wskprops = readWskProps() || {}
    const variables = {}

    variables.auth = options.auth || wskprops.AUTH
    variables.apihost = options.apihost || wskprops.APIHOST
    variables.insecure = options.insecure || wskprops.INSECURE_SSL || false

    return variables
}
exports.resolveVariables = resolveVariables

// Apply configuration to wsk args
const fixupWskArgs = (argv, variables) => {
    if (!argv.includes('-u') && !argv.includes('--auth'))
        argv.push('-u', variables.auth)
    if (!argv.includes('--apihost'))
        argv.push('--apihost', variables.apihost)
    if (!argv.includes('-i') && variables.insecure)
        argv.push('-i')
}

const prepareWskCommand = (wskcmd, argv, options = {}) => {
    const variables = resolveVariables(options)

    if (wskcmd !== 'property') {
        fixupWskArgs(argv, variables)
    }

    let wskConfigFile = ''
    if (wskcmd === 'property') {
        const wskPropsFile = utils.getWskPropsFile()
        if (wskPropsFile)
            wskConfigFile = `WSK_CONFIG_FILE=${wskPropsFile}`
    }

    const args = argv.map(item => `'${item.replace(/'/, `\\'`)}'`).join(' ')

    return `${wskConfigFile} wsk ${wskcmd} ${args}`
}

const spawnWskAndExit = (wskcmd, argv, options = {}) => {
    const fullCmd = prepareWskCommand(wskcmd, argv, options)

    if (process.env.WSKP_DEBUG)
        console.error(`spawn ${fullCmd}`)

    const proc = spawn(fullCmd, { shell: true, stdio: 'inherit' })

    proc.on('close', code => {
        process.exit(code)
    })
}
exports.spawnWskAndExit = spawnWskAndExit

const execWsk = (wskcmd, argv, options = {}) => new Promise((resolve, reject) => {
    const fullCmd = prepareWskCommand(wskcmd, argv, options)

    if (process.env.WSKP_DEBUG)
        console.error(`exec ${fullCmd}`)

    exec(fullCmd, (error, stdout, stderr) => {
        if (error) {
            console.log(stdout)
            console.error(stderr)
            reject(error)
        } else {
            resolve(stdout)
        }
    })
})
exports.execWsk = execWsk

const initOW = (options = {}) => {
    const vars = resolveVariables(options);
    return openwhisk({ api_key: vars.auth, apihost: vars.apihost })
}
exports.initOW = initOW

// ---- options

exports.options = {
    GLOBAL: ['apihost', 'auth', 'insecure']
}

const wskoptions = {
    apihost: { flags: '--apihost <host>', desc: 'whisk API host' },
    auth: { flags: '-u, --auth <key>', desc: 'authorization key' },
    insecure: { flags: '-i, --insecure', desc: 'bypass certificate checking' }
}

const addOptions = (command, options) => {
    for (const name of options) {
        const option = wskoptions[name]
        if (option)
            command.option(option.flags, option.desc)
    }
}
exports.addOptions = addOptions

