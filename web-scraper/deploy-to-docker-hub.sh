#!/bin/bash

docker build -t edgarpdev/salesbot:latest .

docker push edgarpdev/salesbot:latest
