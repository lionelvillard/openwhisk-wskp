#!/usr/bin/env bash

set -e

if [ "$LATEST_WSKD" = true ]; then
  git clone https://github.com/lionelvillard/openwhisk-project.git --depth 3
  cd openwhisk-project
  npm i 
  npm run compilenowatch
  npm link
fi