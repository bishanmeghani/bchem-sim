#Use the official Deno image
FROM denoland/deno:alpine

#Set the working directory inside the container
WORKDIR /app

#Copy required files
COPY deno.json .
COPY import_map.json .
COPY src ./src/

#Set permissions (optional in dev)
RUN deno cache src/main.ts

#Run the application
CMD ["run", "--allow-net", "--allow-read", "src/main.ts"]