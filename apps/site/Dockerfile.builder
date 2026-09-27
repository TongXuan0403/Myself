FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/site/package.json ./apps/site/package.json
COPY apps/admin/package.json ./apps/admin/package.json
RUN npm install --package-lock=false --include=optional
COPY . .
COPY scripts/site-builder.sh /usr/local/bin/site-builder
RUN chmod +x /usr/local/bin/site-builder
ENV MYSELF_CONTENT_DIR=/app/apps/site/src/content/published
CMD ["site-builder"]
