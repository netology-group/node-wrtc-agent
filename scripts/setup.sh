#!/usr/bin/env bash

sudo apt update
sudo apt -y install curl dirmngr apt-transport-https lsb-release ca-certificates
curl -sL https://deb.nodesource.com/setup_10.x | sudo bash
sudo apt update
sudo apt -y install gcc g++ make
sudo apt -y install nodejs
node -v
npm -v
