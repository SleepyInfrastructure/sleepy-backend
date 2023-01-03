# Stage: Build
FROM nginx:alpine AS builder
RUN wget "http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz" -O nginx.tar.gz && \
  	wget "https://github.com/google/ngx_brotli/archive/refs/tags/v1.0.0rc.tar.gz" -O brotli.tar.gz
RUN apk add --no-cache --virtual .build-deps \
	gcc \
	libc-dev \
        make \
        openssl-dev \
        pcre2-dev \
        zlib-dev \
        linux-headers \
        libxslt-dev \
        gd-dev \
        geoip-dev \
        perl-dev \
        libedit-dev \
        bash \
	alpine-sdk \
        findutils

RUN mkdir -p /usr/src
RUN CONFARGS=$(nginx -V 2>&1 | sed -n -e 's/^.*arguments: //p') \
	tar -zxC /usr/src -f nginx.tar.gz && \
  tar -xzvf "brotli.tar.gz" && \
  NCHANDIR="$(pwd)/ngx_brotli-1.0.0rc" && \
  cd /usr/src/nginx-$NGINX_VERSION && \
  ./configure --with-compat $CONFARGS --add-dynamic-module=$NCHANDIR && \
  make && make install

# Stage: Run
FROM nginx:alpine
COPY --from=builder /usr/local/nginx/modules/ngx_http_brotli_filter_module.so /usr/local/nginx/modules/ngx_http_brotli_filter_module.so
COPY --from=builder /usr/local/nginx/modules/ngx_http_brotli_static_module.so /usr/local/nginx/modules/ngx_http_brotli_static_module.so
COPY live /etc/letsencrypt/live
