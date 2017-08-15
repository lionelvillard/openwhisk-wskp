#!/bin/bash
DIRNAME="$( cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd )"

mkdir -p ~/.openwhisk
cd ~/.openwhisk
rm -rf whisk-libs
git clone git@github.ibm.com:villard/whisk-libs.git --depth 2
cd whisk-libs
npm install --production
npm link

cd ${DIRNAME}/..
npm install --production
npm link 
npm link @openwhisk-libs/wsk
