#Use the official Deno image
FROM denoland/deno:alpine

#Set the working directory inside the container
WORKDIR /app

#Copy required files
COPY deno.json .
COPY import_map.json .
COPY src ./src/
COPY tests ./tests/

#Set permissions (optional in dev)
RUN deno cache src/main.ts

#Run the application
CMD ["deno", "run", "--allow-net", "--allow-read", "src/main.ts"]

# Uncomment this if you want to run tests in Docker (for dev environments)
# CMD ["sh", "-c", "deno test --allow-read && deno run --allow-net --allow-read src/main.ts"]
