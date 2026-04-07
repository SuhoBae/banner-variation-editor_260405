export function getOpenAIImageSize(boardWidth, boardHeight) {
  var w = Math.max(1, Number(boardWidth) || 1);
  var h = Math.max(1, Number(boardHeight) || 1);
  var ratio = w / h;
  if (Math.abs(ratio - 1) < 0.08) return "1024x1024";
  return ratio > 1 ? "1536x1024" : "1024x1536";
}

export async function generateOpenAIImage(options) {
  var apiKey = options && options.apiKey;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  var prompt = String((options && options.prompt) || "").trim();
  if (!prompt) {
    throw new Error("Prompt is required.");
  }

  var model = (options && options.model) || process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
  var size = (options && options.size) || getOpenAIImageSize(options && options.boardWidth, options && options.boardHeight);
  var quality = (options && options.quality) || "medium";

  var response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      size: size,
      quality: quality,
      output_format: "png",
      moderation: "auto",
    }),
  });

  var payloadText = await response.text();
  var payload = {};
  try {
    payload = payloadText ? JSON.parse(payloadText) : {};
  } catch (error) {
    payload = { raw: payloadText };
  }

  if (!response.ok) {
    var apiMessage =
      (payload && payload.error && payload.error.message) ||
      payloadText ||
      "Image generation failed.";
    throw new Error(apiMessage);
  }

  var imageEntry = payload && payload.data && payload.data[0];
  var b64 =
    imageEntry &&
    (imageEntry.b64_json || imageEntry.base64 || imageEntry.image_base64);

  if (!b64) {
    throw new Error("The image response did not include PNG data.");
  }

  return {
    dataUrl: "data:image/png;base64," + b64,
    model: model,
    size: size,
    revisedPrompt: imageEntry.revised_prompt || null,
  };
}

