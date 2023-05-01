#!/bin/sh
VERSION=$(cat version)

# docker buildx create --name famcomp_builder
# docker buildx use famcomp_builder
# docker buildx inspect --bootstrap

# echo "Building image version: $VERSION"
# docker build . -f Dockerfile.local --platform linux/amd64,linux/arm64 -t holynoodledev/family-companion:$VERSION

# echo "Pushing to docker hub"
# cat ./password.txt | docker login -u holynoodledev --password-stdin
# docker push holynoodledev/family-companion:$VERSION

echo "Bump home assistant addon version: $VERSION"
sed -i "s/version: .*/version: $VERSION/" config.yaml 

# echo "Update main Dockerfile image version: $VERSION"
# sed -i "s/holynoodledev\/family-companion:.*/holynoodledev\/family-companion:$VERSION/" Dockerfile 

git add config.yaml Dockerfile
git commit -m "chore: version bump $VERSION"
git push origin main