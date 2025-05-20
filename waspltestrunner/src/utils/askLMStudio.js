export function extractJsonFromResponse(responseText) {
    // D'abord essayer le format ```json ... ```
    const tripleBacktickMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    if (tripleBacktickMatch && tripleBacktickMatch[1]) {
      try {
        return JSON.parse(tripleBacktickMatch[1]);
      } catch (e) {
        console.warn("Échec parsing triple backtick:", e.message);
      }
    }
  
    // Sinon essayer un premier objet JSON trouvé n'importe où
    const firstJsonMatch = responseText.match(/{[\s\S]*?}/);
    if (firstJsonMatch && firstJsonMatch[0]) {
      try {
        return JSON.parse(firstJsonMatch[0]);
      } catch (e) {
        console.warn("Échec parsing first JSON:", e.message);
      }
    }
  
    console.warn("❌ Aucun JSON valide détecté");
    return null;
  }
  
  
  
  async function isLMStudioAvailable(url = "http://localhost:1234") {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
  
    try {
      const res = await fetch(`${url}/v1/models`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (e) {
      console.warn("LMStudio non disponible :", e.message);
      return false;
    }
  }
  
  export async function askLMStudio({
    prompt,
    currentAxis,
    elID,
    updateResults,
    updateLoadingMap,
    model = "deepseek-r1-distill-qwen-7b",
    maxRetries = 3,
    apiUrl = "http://localhost:1234/v1/completions"
  }) {
    updateLoadingMap(true);
  
    try {
      const available = await isLMStudioAvailable();
      if (!available) {
        alert("❌ LMStudio n'est pas lancé sur http://localhost:1234");
        updateLoadingMap(false);
        return;
      }
  
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          prompt,
          temperature: 0.1,
          max_tokens: 500,
          stop: null
        })
      });
  
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      //console.warn("Réponse brute AI :", data.choices[0].text);
      const parsed = extractJsonFromResponse(data.choices[0].text);
  
      if (parsed) {
        updateResults({
          axis: currentAxis,
          response: parsed,
          score: parsed.answer ? 10 : 0, // à ajuster selon la logique réelle
          model: data.model
        });
      } else {
        throw new Error("Réponse AI invalide ou vide.");
      }
  
    } catch (error) {
      console.error("Erreur pendant l’appel LMStudio :", error.message);
    } finally {
      updateLoadingMap(false);
    }
  }
  