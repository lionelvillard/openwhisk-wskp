#!/bin/bash
DIRNAME="$( cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd )"

mkdir -p ~/.openwhisk
cd ~/.openwhisk
rm -rf whisk-libs
git clone git@github.ibm.com:villard/whisk-libs.git 
cd whisk-libs
git checkout tags/v0.1.0
npm install --production
npm link

cd ${DIRNAME}/..
npm install --production
npm link 
npm link @openwhisk-libs/wsk
