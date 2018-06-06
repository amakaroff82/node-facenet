FROM ubuntu:17.10
LABEL maintainer="Huan LI <zixia@zixia.net>"

ENV DEBIAN_FRONTEND noninteractive
ENV LC_ALL          C.UTF-8

RUN apt-get update && apt-get install -y \
      build-essential \
      curl \
      wget \
      g++ \
      git \
      iputils-ping \
      libcairo2-dev \
      libjpeg8-dev \
      libpango1.0-dev \
      libgif-dev \
      python2.7 \
      python3.6 \
      python3.6-dev \
      python3-venv \
      sudo \
      tzdata \
      vim \
  && rm -rf /var/lib/apt/lists/*

RUN apt-get install apt-transport-https

RUN curl -sL https://deb.nodesource.com/setup_9.x | bash - \
  && apt-get update && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install yarn
RUN npm install -g ts-node typescript

RUN python3 -m venv python3 && . python3/bin/activate

ENV PYTHON_PIP_VERSION 10.0.1

RUN set -ex; \
	\
	wget -O get-pip.py 'https://bootstrap.pypa.io/get-pip.py'; \
	\
	python3 get-pip.py \
		--disable-pip-version-check \
		--no-cache-dir \
		"pip==$PYTHON_PIP_VERSION"

RUN pip3 install flake8 mypy pillow pylint pytest opencv-python scipy sklearn tensorflow typing wheel

# RUN yarn
# RUN npm install numjs flash-store

EXPOSE 8080

VOLUME [ "/facenet" ]                               `

WORKDIR /facenet
