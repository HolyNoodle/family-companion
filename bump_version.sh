#!/bin/sh
VERSION=$(cat version)

echo "Update main Dockerfile image version: $VERSION"
sed -i "s/holynoodledev\/family-companion:.*/holynoodledev\/family-companion:$VERSION/" Dockerfile 

git add config.yaml Dockerfile
git commit -m "chore: version bump $VERSION"
git push origin main