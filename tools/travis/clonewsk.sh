#!/usr/bin/env bash

set -e

if [ "$LATEST_WKD" == true ]; then
  git clone https://github.com/lionelvillard/openwhisk-deploy.git --depth 3
  cd openwhisk-deploy
  npm i 
  npm run compilenowatch
  npm link
fi
