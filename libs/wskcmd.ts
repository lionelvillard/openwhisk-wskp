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
const utils = require('./utils.js')
const { spawnSync } = require('child_process')

module.exports = (wskcmd, argv, options = {}) => {
    if (wskcmd !== 'property') {
        const wskprops = utils.auth(options)
        if (!argv.includes('-u') && !argv.includes('--auth')) 
            argv.push('-u', wskprops.api_key)
        if (!argv.includes('--apihost')) 
            argv.push('--apihost', wskprops.apihost)
         if (!argv.includes('-i') && wskprops.insecure)
            argv.push('-i')
    }
    let wskConfigFile = ''
    if (wskcmd === 'property') {
        const wskPropsFile = utils.getWskPropsFile()
        if (wskPropsFile)
            wskConfigFile = `WSK_CONFIG_FILE=${wskPropsFile}`
    }

    const args = argv.map(item => `'${item.replace(/'/, `\\'`)}'`).join(' ')

    const fullCmd = `${wskConfigFile} wsk ${wskcmd} ${args}`

    if (process.env.WSKP_DEBUG)
        console.error(`call ${fullCmd}`)

    const proc = spawnSync(fullCmd, { shell: true, stdio: 'inherit' })
    if (proc.error) {
        process.exit(proc.status)
    }
}