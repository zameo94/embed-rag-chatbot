FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_WIDGET_API_URL
ENV VITE_WIDGET_API_URL=$VITE_WIDGET_API_URL
RUN test -n "$VITE_WIDGET_API_URL" \
  || (echo "VITE_WIDGET_API_URL is required (public API URL the widget calls)" >&2; exit 1)
RUN npm run build

FROM nginx:1.27-alpine AS serve
ARG WIDGET_EMBED_KEY=""
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/demo/index.html /usr/share/nginx/html/index.html
RUN sed -i "s|__EMBED_KEY__|${WIDGET_EMBED_KEY}|g" /usr/share/nginx/html/index.html
EXPOSE 80
