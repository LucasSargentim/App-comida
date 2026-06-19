import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Lazy initialization of Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("Aviso: GEMINI_API_KEY não encontrada nas variáveis de ambiente!");
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  // Configure larger payload limits for transferring photo base64 strings directly in request bodies
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // API Route: Analyzes food plates from binary image data
  app.post("/api/analyze", async (req: any, res: any) => {
    try {
      const { image, mimeType } = req.body;
      if (!image || !mimeType) {
        return res.status(400).json({ error: "A imagem e o formato MIME correspondente são obrigatórios." });
      }

      let ai: GoogleGenAI;
      try {
        ai = getGeminiClient();
      } catch (err: any) {
        if (err.message === "GEMINI_API_KEY_MISSING") {
          return res.status(500).json({
            error: "A chave de API do Gemini (GEMINI_API_KEY) está ausente nas configurações do servidor. Por favor, adicione seu Secret no painel superior 'Settings > Secrets' no AI Studio para realizar as análises de fotos."
          });
        }
        throw err;
      }

      // Format parts for Gemini Developer SDK
      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: image
        }
      };

      const textPart = {
        text: "Analise detalhadamente a foto deste prato de comida e forneça a distribuição calórica e de macronutrientes dos alimentos detectados, bem como sugestões de nutrientes e alternativas baseadas nas porções aparentes."
      };

      console.log("Chamando Gemini API para analisar o prato...");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction: "Você é um nutricionista sênior virtual qualificado. Analise imagens de pratos de comida enviados. Estime com precisão cientificamente fundamentada cada ingrediente perceptível, detalhando sua porção aproximada em gramas (g) ou unidades caseiras, calorias, e macronutrientes (proteínas, carboidratos e gorduras). Realize uma avaliação geral balanceada sobre a refeição, forneça sugestões construtivas de nutrientes para enriquecer o prato (ex: fibras, minerais em falta) de acordo com uma nutrição funcional, e sugira alternativas saudáveis para reduzir calorias ou otimizar a digestibilidade. Sua resposta DEVE ser estritamente em português brasileiro (pt-BR) e aderir perfeitamente à estrutura JSON especificada.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dishName: { type: Type.STRING, description: "Nome do prato ou descrição geral do prato detectado (ex: Prato de Arroz com Feijão e Bife)." },
              confidence: { type: Type.NUMBER, description: "Confiança na precisão visual do prato mapeado (de 0.0 a 1.0)." },
              totalCalories: { type: Type.NUMBER, description: "Soma exata das calorias de todos os ingredientes detectados (kcal)." },
              totalCarbs: { type: Type.NUMBER, description: "Total de carboidratos estimados em gramas (g)." },
              totalProtein: { type: Type.NUMBER, description: "Total de proteínas estimadas em gramas (g)." },
              totalFats: { type: Type.NUMBER, description: "Total de gorduras estimadas em gramas (g)." },
              ingredients: {
                type: Type.ARRAY,
                description: "Lista de ingredientes ou alimentos identificados que fazem parte do prato.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Nome do ingrediente (ex: Arroz Integral Cozido)." },
                    portion: { type: Type.STRING, description: "Porção ou estimativa visual de volume (ex: 150g, 1 xícara de chá, 1 colher de sopa)." },
                    calories: { type: Type.NUMBER, description: "Calorias estimadas neste item específico (kcal)." },
                    carbs: { type: Type.NUMBER, description: "Carboidratos do item em gramas (g)." },
                    protein: { type: Type.NUMBER, description: "Proteínas do item em gramas (g)." },
                    fats: { type: Type.NUMBER, description: "Gorduras do item em gramas (g)." }
                  },
                  required: ["name", "portion", "calories", "carbs", "protein", "fats"]
                }
              },
              nutritionalAssessment: {
                type: Type.STRING,
                description: "Uma avaliação qualitativa e profissional sobre o equilíbrio global do prato analisado."
              },
              nutrientSuggestions: {
                type: Type.ARRAY,
                description: "Quais nutrientes estão carentes ou como enriquecer o prato (ex: 'Falta fibra e antioxidantes, tente incluir folhas verdes ou beterraba grelhada').",
                items: { type: Type.STRING }
              },
              healthyAlternatives: {
                type: Type.ARRAY,
                description: "Sugestões de substituições saudáveis que cabem neste prato (ex: 'Troque o bife frito por um filé grelhado para economizar 120 calorias').",
                items: { type: Type.STRING }
              }
            },
            required: [
              "dishName",
              "confidence",
              "totalCalories",
              "totalCarbs",
              "totalProtein",
              "totalFats",
              "ingredients",
              "nutritionalAssessment",
              "nutrientSuggestions",
              "healthyAlternatives"
            ]
          }
        }
      });

      const jsonStr = response.text;
      if (!jsonStr) {
        throw new Error("Não foi possível obter resposta em texto do modelo.");
      }

      console.log("Prato analisado com sucesso pelo Gemini!");
      const report = JSON.parse(jsonStr.trim());
      return res.json(report);

    } catch (error: any) {
      console.error("Erro na análise da foto:", error);
      return res.status(500).json({ error: "Erro interno ao processar a análise da imagem. Detalhes: " + error.message });
    }
  });

  // Client asset serving / developer proxy
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
