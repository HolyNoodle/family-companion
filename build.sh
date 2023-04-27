docker build . -f Dockerfile -t holynoodledev/family-companion:0.11

cat ./password.txt | docker login -u holynoodledev --password-stdin
docker push holynoodledev/family-companion:0.11
