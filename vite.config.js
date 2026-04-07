import { defineConfig } from "vite";
import { generateOpenAIImage } from "./server/openai-image.js";

function readJsonBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    req.on("data", function (chunk) {
      chunks.push(chunk);
    });
    req.on("end", function () {
      try {
        var raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

export default defineConfig({
  plugins: [
    {
      name: "local-openai-image-api",
      configureServer(server) {
        server.middlewares.use("/api/generate-image", async function (req, res, next) {
          if (req.method !== "POST") {
            return next();
          }

          try {
            var body = await readJsonBody(req);
            var result = await generateOpenAIImage({
              apiKey: process.env.OPENAI_API_KEY,
              model: process.env.OPENAI_IMAGE_MODEL,
              prompt: body && body.prompt,
              boardWidth: body && body.boardWidth,
              boardHeight: body && body.boardHeight,
              size: body && body.size,
              quality: body && body.quality,
            });

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: error && error.message ? error.message : "Unknown image generation error.",
              })
            );
          }
        });
      },
    },
  ],
});

