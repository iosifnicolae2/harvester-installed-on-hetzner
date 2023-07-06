#!/bin/bash
set -e


# build the image
docker build --build-arg IPXE_HOST=$1 . \
  --platform=linux/amd64 \
  -t ipxe-build:latest \

# run the container
docker run -it -d  --platform=linux/amd64 --name ipxe-build ipxe-build:latest

set -x
# make a dist folder
test -d dist || mkdir dist

# copy out the ipxe.iso file
docker cp ipxe-build:/dist/ipxe.iso dist/
docker cp ipxe-build:/dist/ipxe.usb dist/

# stop and remove the container
docker kill ipxe-build
docker rm ipxe-build

# checksums
shasum dist/ipxe.iso > dist/ipxe.iso.sha1
shasum -a 256 dist/ipxe.iso > dist/ipxe.iso.sha256
# checksums
shasum dist/ipxe.usb > dist/ipxe.usb.sha1
shasum -a 256 dist/ipxe.usb > dist/ipxe.usb.sha256

# display
tree dist