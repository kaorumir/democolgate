# ---- build ----
FROM node:20-alpine AS build
WORKDIR /work

# instala deps
COPY demo/package*.json ./demo/
RUN cd demo && npm ci

# copia el código
COPY demo ./demo

# build (ajusta si tu script se llama diferente)
RUN cd demo && npm run build

# ---- runtime ----
FROM nginx:alpine
# UI5 suele generar dist/ o webapp/ dependiendo del setup
# si tu build genera "dist", esto está bien:
COPY --from=build /work/demo/dist /usr/share/nginx/html

# nginx escucha 80 por defecto
EXPOSE 80
