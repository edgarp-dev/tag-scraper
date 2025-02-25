#!/bin/bash

docker build --no-cache -t edgarpdev/salesbot:latest .

docker push edgarpdev/salesbot:latest
