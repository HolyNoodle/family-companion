#!/bin/sh
VERSION=$(cat version)

# docker buildx create --name famcomp_builder --platform linux/amd64,linux/arm64,linux/aarch64
# docker buildx use famcomp_builder0
# docker buildx inspect --bootstrap

echo "Building image version: $VERSION"
cat ./password.txt | docker login -u holynoodledev --password-stdin

# linux/aarch64 not working for some reason
docker buildx build . -f Dockerfile.local --platform linux/amd64,linux/arm64,linux/arm/v8,linux/arm/v7,linux/arm/v6 -t holynoodledev/family-companion:$VERSION --push
