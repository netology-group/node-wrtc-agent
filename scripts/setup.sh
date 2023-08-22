#!/usr/bin/env bash

sudo apt update
sudo apt -y install curl dirmngr apt-transport-https lsb-release ca-certificates
curl -sL https://deb.nodesource.com/setup_16.x | sudo bash
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
sudo apt update
sudo apt -y install gcc g++ make
sudo apt -y install nodejs
