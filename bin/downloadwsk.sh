#!/bin/bash

(mkdir win32 && cd win32 && wget https://openwhisk.ng.bluemix.net/cli/go/download/windows/amd64/wsk.exe)
(mkdir darwin && cd darwin && wget https://openwhisk.ng.bluemix.net/cli/go/download/mac/amd64/wsk)
(mkdir linux && cd linux && wget https://openwhisk.ng.bluemix.net/cli/go/download/linux/amd64/wsk)
