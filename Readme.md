# How to install Harvester on Hetzner Dedicated Servers
1. Create a Cloudflare Worker with the content of [./cloudflare-workers/worker.js](cloudflare-workers%2Fworker.js)
2. Compile IPXE to boot from Cloudflare Workers
```bash
cd ./ipxe
./build.sh https://YOUR_CLOUDFLARE_WORKER_HOSTNAME_HERE
cp ./dist/ipxe.usb ../cloudflare-bucket/assets/ipxe.usb
```
3. Copy Harvester images
```bash
curl https://github.com/harvester/harvester/releases/download/v1.1.2/harvester-v1.1.2-initrd-amd64 -o ./cloudflare-bucket/assets/harvester-v1.1.2-initrd-amd64
curl https://github.com/harvester/harvester/releases/download/v1.1.2/harvester-v1.1.2-vmlinuz-amd64 -o ./cloudflare-bucket/assets/harvester-v1.1.2-vmlinuz-amd64
curl https://releases.rancher.com/harvester/v1.1.2/harvester-v1.1.2-rootfs-amd64.squashfs -o ./cloudflare-bucket/assets/harvester-v1.1.2-rootfs-amd64.squashfs
```
 - obs, the reason why we're serving this assets using Cloudflare Workers is because IPXE image has some problems with TLS certificates and we've embeded Cloudflare Root CA in the IPXE image
4. In [./cloudflare-bucket](cloudflare-bucket) update it following the below instructions:
    - create `ipxe` from `ipxe.example` and update it with the hostname of the worker created in step 1
    - replace <server-public-ip> with your own server ip (the public ip)
    - replace <server-internal-ip> with your own server interface ip (`ip a`)
    - replace <server-mac> with your own server interface mac (`ip a`)
    - create a file named `harvester_config.yaml` from `harvester_config.yaml.example` and update it with your own configuration (we're generating this file using terraform: [example](https://gist.github.com/iosifnicolae2/9228b1f036951e97c67c0efa4d3508fb))
        - as you can see in the example, we have 3 vSwitch attached to our server (VLAN IDs: 4000-4002), update them with your own topology
        - our networks are attached to multiple Hetzner Cloud Networks and we have a RouterOS deployed in the cloud
    - obs. after booting the IPXE OS you can watch the logs of the Cloudflare Worker to see which resources are being requested
5. Upload the content of [./cloudflare-bucket](cloudflare-bucket) directory to the created R2 Bucket (you might need to use S3 interface to upload the big files eg. [rclone](https://developers.cloudflare.com/r2/examples/rclone/)).
6. Connect the created R2 Bucket to Cloudflare Worker and name it `BOOT_BUCKET`
7. Order a USB stick on Hetzner, specify to the support team that you want the server to boot firstly from USB, then from HDD
8. Boot the server in rescue mode
9. Flash ipxe.usb to the USB stick
```bash
scp ./cloudflare-bucket/dist/ipxe.usb root@YOUR_SERVER_IP_HERE:/root/ipxe.usb
# or ssh into server and run: curl --fail https://YOUR_CLOUDFLARE_WORKER_HOSTNAME_HERE/assets/ipxe.usb -o /root/ipxe.usb
ssh root@YOUR_SERVER_IP_HERE
lsblk
# identify which disks will be used to install harvester on it (eg. /dev/nvme2n1 for data disk and /dev/nvme1n1 for OS disk)
dd if=/dev/zero of=/dev/sda bs=512 count=1024 && sync
dd bs=4M if=/root/ipxe.usb of=/dev/sda && sync
reboot now
```
10. After reboot, the server will boot into IPXE OS which will setup Harvester for you.
11. You can connect the KVM console and watch the installation process.
    - if you don't have a KVM console, you can login into the server and watch the logs:
```bash
ssh rancher@YOUR_SERVER_IP_HERE
# password is rancher
sudo su
tail -n 100 /var/log/console.log
screendump
```
12. After installation, the server will reboot into Harvester OS.
    - please note that the configurations files from R2 Bucket have been deleted to prevent another installation to start.
13. Your installation is completed.
14. We recommend blocking incoming traffic using Hetzner Dedicated Server Firewall except ICMP, port 22, internal networks, etc.
