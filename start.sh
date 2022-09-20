#!/bin/bash
git pull
yarn install
yarn build
pm2 start yarn --name csi-new -- start
pm2 delete csi || true
pm2 restart csi-new --name csi

