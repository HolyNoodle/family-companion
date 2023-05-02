#!/bin/sh
VERSION=$(cat VERSION)

echo "Bump home assistant addon version: $VERSION"
sed -i "s/version: .*/version: $VERSION/" config.yaml 

echo "Update main Dockerfile image version: $VERSION"
sed -i "s/holynoodledev\/family-companion:.*/holynoodledev\/family-companion:$VERSION/" Dockerfile 

git add config.yaml Dockerfile