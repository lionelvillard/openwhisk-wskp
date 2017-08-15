const { exec } = require('child-process-promise')
const expect = require('chai').expect

it('test wskp with no args', async () => {
    const output = await exec('./wskp.js')

    expect(output.stdout).to.contain('Apache OpenWhisk CLI with extensions')
})

describe('test environment', () => {
    const wskp = '../../wskp.js'
    const cwd = 'test/fixtures'

    it('with no args', async () => {
        const output = await exec(`${wskp} env`, {cwd})
        expect(output.stdout).to.contain('Usage: wskp-env <command> [options]')
    })

    it('env list', async () => {
        const output = await exec(`${wskp} env list`, {cwd})
        expect(output.stdout).to.equals('test\n\n')
    })

    it('env set test', async () => {
        const output = await exec(`${wskp} env set test`, {cwd})
        expect(output.stdout).to.equals('')
    })

    it('env set invalid environment name', async () => {
        const output = await exec(`${wskp} env set invalidenv`, {cwd})
        expect(output.stderr).to.equals('invalidenv does not exist\n')
    })

})