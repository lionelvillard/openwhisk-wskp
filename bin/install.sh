#!/bin/bash
DIRNAME="$( cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd ${DIRNAME}/..
npm install --production
npm link 

cd ${DIRNAME}
git clone git@github.ibm.com:villard/whisk-libs.git --depth 2
cd whisk-libs
npm install --production
npm link

cd ${DIRNAME}/..
npm link @openwhisk-libs/wsk
