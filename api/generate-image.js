import { generateOpenAIImage } from "../server/openai-image.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    var result = await generateOpenAIImage({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_IMAGE_MODEL,
      prompt: req.body && req.body.prompt,
      boardWidth: req.body && req.body.boardWidth,
      boardHeight: req.body && req.body.boardHeight,
      size: req.body && req.body.size,
      quality: req.body && req.body.quality,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: error && error.message ? error.message : "Unknown image generation error.",
    });
  }
}

