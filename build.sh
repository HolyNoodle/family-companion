#!/bin/sh
VERSION=$(cat version)

echo "Building image version: $VERSION"
docker build . -f Dockerfile.local -t holynoodledev/family-companion:$VERSION --platform linux/amd64

echo "Pushing to docker hub"
cat ./password.txt | docker login -u holynoodledev --password-stdin
docker push holynoodledev/family-companion:$VERSION

echo "Bump home assistant addon version: $VERSION"
sed -i "s/version: .*/version: $VERSION/" config.yaml 

echo "Update main Dockerfile image version: $VERSION"
sed -i "s/holynoodledev\/family-companion:.*/holynoodledev\/family-companion:$VERSION/" Dockerfile 

git add config.yaml Dockerfile
git commit -m "chore: version bump $VERSION"
git push origin main