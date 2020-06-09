#!/usr/bin/env bash

git clone git@github.com:netology-group/node-wrtc-agent.git
cd node-wrtc-agent
npm i
npm run copy-module-linux
sudo npm link
