export function parseWpJsonResponse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const recovered = recoverJsonPayload(text);
    if (!recovered) {
      throw new Error(`WordPress returned non-JSON response: ${text.slice(0, 240)}`);
    }
    return JSON.parse(recovered);
  }
}

function recoverJsonPayload(text) {
  const objectIndex = text.indexOf("{");
  const arrayIndex = text.indexOf("[");
  const indexes = [objectIndex, arrayIndex].filter((index) => index >= 0);

  if (indexes.length === 0) {
    return "";
  }

  return text.slice(Math.min(...indexes));
}
