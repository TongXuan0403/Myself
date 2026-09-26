#!/bin/sh
set -eu
until [ -f /usr/share/nginx/html/index.html ] && [ -f /usr/share/nginx/admin/index.html ]; do
  sleep 1
done
exec nginx -g 'daemon off;'
