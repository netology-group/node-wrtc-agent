FROM ubuntu:16.04

# Install packages necessary for compilation.
RUN apt-get update \
  && apt-get install -y sudo curl git \
  && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN cd ~ \
  && curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash - \
  && sudo apt-get install -y nodejs \
  && node -v \
  && npm -v

# Clone repo and run build
# https://github.com/netology-group/node-wrtc-agent.git
RUN \
  BUILD_DIR='/home/node-wrtc-agent' \
  && git clone https://github.com/netology-group/node-wrtc-agent.git ${BUILD_DIR} \
  && cd ${BUILD_DIR} \
  && npm install \
  && npm run copy-module-linux \
  && sudo npm link
