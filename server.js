// server.js (Versão final com mensagem de erro personalizada para Stability AI)

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

app.post('/api/generate-logo', async (req, res) => {
    const { serverName, logoTheme } = req.body;

    try {
        if (!STABILITY_API_KEY) {
            return res.status(500).json({ error: "Chave de API da Stability AI não configurada no arquivo .env." });
        }

        const prompt = `Create a professional and unique logo for a game server named "${serverName}", with a theme of "${logoTheme}". The logo should be clean, modern, and visually appealing, ready for use as a PNG.`;

        const payload = {
            prompt: prompt,
            output_format: "png",
            model: "sd3-5"
        };

        const response = await axios.postForm(
            "https://api.stability.ai/v2beta/stable-image/generate/core",
            axios.toFormData(payload),
            {
                validateStatus: undefined,
                responseType: "arraybuffer",
                headers: {
                    Authorization: `Bearer ${STABILITY_API_KEY}`,
                    Accept: "image/*"
                }
            }
        );

        if (response.status !== 200) {
            const errorText = Buffer.from(response.data).toString('utf-8');
            
            // Verifica se o erro é de créditos insuficientes (status 402)
            if (response.status === 402) {
                return res.status(402).json({ error: "Geração de imagem limitada por hoje. Tente novamente amanhã ou verifique seus créditos." });
            }
            
            // Para outros erros, exibe a mensagem original da API
            throw new Error(`Erro na API da Stability: ${response.status} - ${errorText}`);
        }

        const buffer = Buffer.from(response.data);
        
        res.setHeader('Content-Type', 'image/png');
        res.send(buffer);

    } catch (error) {
        console.error("Erro na comunicação com a API de IA:", error);
        res.status(500).json({ error: "Ocorreu um erro ao gerar a logo. Por favor, tente novamente mais tarde." });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});