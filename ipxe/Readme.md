## If you want to speed up the build process on Macbook Pro M1, you can build remotely using
```bash
export DOCKER_HOST="ssh://root@YOUR_SERVER_WITH_DOCKER_IP_HERE"
./build.sh https://YOUR_CLOUDFLARE_WORKER_HOSTNAME_HERE
```