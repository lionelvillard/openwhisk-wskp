#!/usr/bin/env bash

wget https://public.dhe.ibm.com/cloud/bluemix/cli/bluemix-cli/latest/Bluemix_CLI_amd64.tar.gz && \
tar zxvf Bluemix_CLI_amd64.tar.gz && \
cd Bluemix_CLI && \
sudo ./install_bluemix_cli

bx plugin install Cloud-Functions -r Bluemix

bx login -a https://api.ng.bluemix.net -o $IBMCLOUD_ORG -s $IBMCLOUD_TARGET

# generate .wskprops
bx wsk property get
