FROM buildpack-deps:xenial

# Install packages necessary for compilation.
RUN apt-get update \
  && apt-get install -y sudo \
  && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN cd ~ \
  && curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash - \
  && sudo apt-get install -y nodejs \
  && node -v \
  && npm -v

# Install CMake
RUN \
  cd ~ \
  && wget https://cmake.org/files/v3.12/cmake-3.12.3-Linux-x86_64.sh \
  && chmod +x cmake-3.12.3-Linux-x86_64.sh \
  && sudo ./cmake-3.12.3-Linux-x86_64.sh --skip-license \
  && sudo ln -s $(pwd)/bin/* /usr/local/bin \
  && rm cmake-3.12.3-Linux-x86_64.sh

# Clone repo and run build
# https://github.com/netology-group/node-wrtc-agent.git
RUN \
  BUILD_DIR='/home/node-wrtc-agent' \
  && git clone https://github.com/netology-group/node-wrtc-agent.git ${BUILD_DIR} \
  && cd ${BUILD_DIR} \
  && npm install --no-optional --unsafe-perm \
  && cd ${BUILD_DIR}/node_modules/wrtc \
  && SKIP_DOWNLOAD=true npm install --no-optional --unsafe-perm

# Cleanup after build
RUN \
  BUILD_DIR='/home/node-wrtc-agent/node_modules/wrtc/build' \
  && cd ${BUILD_DIR} \
  && rm -rf CMakeFiles external node temp \
  && rm -f cmake_install.cmake CMakeCache.txt Makefile
