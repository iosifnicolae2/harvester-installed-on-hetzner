FROM ubuntu:22.04

# ipxe version
ENV IPXE_VERSION=master

# build area
WORKDIR /build

# install build tools
RUN apt-get update && \
    apt-get install -y build-essential git isolinux liblzma-dev mkisofs curl

# clone the ipxe repo
RUN git clone -b ${IPXE_VERSION} https://github.com/ipxe/ipxe

# Allow download by HTTPS
# https://ipxe.org/buildcfg/download_proto_https
RUN sed -ie 's/#undef	DOWNLOAD_PROTO_HTTPS/#define DOWNLOAD_PROTO_HTTPS/' ipxe/src/config/general.h
RUN sed -ie 's/#undef	NTP_CMD/#define NTP_CMD/' ipxe/src/config/general.h
RUN sed -ie 's/#undef	REBOOT_CMD/#define REBOOT_CMD/' ipxe/src/config/general.h

ARG IPXE_HOST
RUN <<EOF cat > /build/run.ipxe
#!ipxe
dhcp || goto dhcp_failed
chain $IPXE_HOST\${net0/ip}/\${net0/mac}/ipxe || goto boot_failed

:dhcp_failed
echo DHCP failed, booting from local disk in 5 seconds
sleep 5
exit

:boot_failed
echo BOOT failed, booting from local disk in 5 seconds
sleep 5
exit
EOF


RUN curl -s http://ca.ipxe.org/ca.crt > /build/ca.pem
RUN curl -s https://letsencrypt.org/certs/isrgrootx1.pem > /build/isrgrootx1.pem
RUN curl -s https://letsencrypt.org/certs/lets-encrypt-r3.pem > /build/lets-encrypt-r3.pem
RUN curl -s https://cacerts.digicert.com/DigiCertTLSECCP384RootG5.crt.pem > /build/cl.pem

RUN cd ipxe/src && \
    make bin/ipxe.iso EMBED=/build/run.ipxe CERT=/build/ca.pem,/build/isrgrootx1.pem,/build/lets-encrypt-r3.pem,/build/cl.pem TRUST=/build/ca.pem,/build/isrgrootx1.pem,/build/lets-encrypt-r3.pem,/build/cl.pem \
 && \
    make bin/ipxe.usb EMBED=/build/run.ipxe CERT=/build/ca.pem,/build/isrgrootx1.pem,/build/lets-encrypt-r3.pem,/build/cl.pem TRUST=/build/ca.pem,/build/isrgrootx1.pem,/build/lets-encrypt-r3.pem,/build/cl.pem

FROM busybox:latest
WORKDIR /dist
COPY --from=0 /build/ipxe/src/bin/ipxe.iso /dist/ipxe.iso
COPY --from=0 /build/ipxe/src/bin/ipxe.usb /dist/ipxe.usb