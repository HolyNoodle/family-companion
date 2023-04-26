docker build . -f Dockerfile.prod -t holynoodledev/family-companion:0.10

cat ./password.txt | docker login -u holynoodledev --password-stdin
docker push holynoodledev/family-companion:0.10
