FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/site/package.json ./apps/site/package.json
COPY apps/admin/package.json ./apps/admin/package.json
RUN npm install --package-lock=false --include=optional
RUN npm install --package-lock=false --no-save @rolldown/binding-linux-x64-gnu@1.2.7
COPY . .
ENV VITE_API_BASE_URL=
CMD ["sh", "-c", "npm --workspace apps/admin run build && rm -rf /out/* && cp -a apps/admin/dist/. /out/"]
