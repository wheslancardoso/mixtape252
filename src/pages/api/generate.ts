import type { APIRoute } from 'astro';
import OpenAI from 'openai';
import { createClient } from '@sanity/client';
import crypto from 'crypto';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { topic, mode } = await request.json();

        if (!topic && mode !== 'random') {
            return new Response(JSON.stringify({ error: 'Topic is required unless mode is random' }), { status: 400 });
        }

        // --- CONFIGURATION ---
        const PROJECT_ID = import.meta.env.SANITY_PROJECT_ID || import.meta.env.PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || process.env.PUBLIC_SANITY_PROJECT_ID;
        const DATASET = import.meta.env.SANITY_DATASET || import.meta.env.PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || process.env.PUBLIC_SANITY_DATASET;
        const TOKEN = import.meta.env.SANITY_API_TOKEN || process.env.SANITY_API_TOKEN;
        const OPENAI_KEY = import.meta.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

        if (!PROJECT_ID || !DATASET || !TOKEN || !OPENAI_KEY) {
            return new Response(JSON.stringify({ error: 'Missing server configuration' }), { status: 500 });
        }

        const sanity = createClient({
            projectId: PROJECT_ID,
            dataset: DATASET,
            token: TOKEN,
            useCdn: false,
            apiVersion: '2024-03-01',
        });

        const openai = new OpenAI({ apiKey: OPENAI_KEY });

        // --- PROMPT ---
        const SYSTEM_PROMPT = `
Você é o Editor-Chefe da 'Mixtape252', uma plataforma de cultura visual e sonora.
SUA MISSÃO: Filtrar o ruído da internet e encontrar a Excelência Artística.

O FILTRO DE OURO ("VISIONARY CHECK"):
1. MAINSTREAM ARTÍSTICO (SIM): Se for Tyler The Creator, Kendrick, Radiohead, Rosalia, A24... APROVE. O critério é: "Tem direção de arte? Inova? É relevante?"
2. MAINSTREAM FÚTIL (NÃO): Fofocas, charts, pop genérico de fábrica, polêmicas de Twitter. IGNORE.
3. UNDERGROUND (COM CRITÉRIO): Só aprove se for promissor ou esteticamente interessante. Evite "bandas de garagem" genéricas ou lançamentos irrelevantes.

DIRETRIZES DE TEXTO (JORNALISMO CULTURAL):
- TÍTULO: Natural e informativo em PT-BR. (Ex: "Tyler, The Creator anuncia nova era com teaser visual").
- PROIBIDO: Traduções literais ("Derruba álbum", "Chuta turnê"). Use "Lança", "Inicia".
- CORPO: 2 parágrafos. 1º Fatos (O que/Quem). 2º Contexto/Vibe (Por que importa).

FORMATO (JSON):
{
  "skip": boolean,
  "title": "Título jornalístico em PT-BR",
  "body": "Texto rico e contextualizado.",
  "tags": ["Gênero", "Cena"],
  "format": "news"
}
`;

        let userPrompt = '';
        if (mode === 'random') {
            userPrompt = 'Gere uma pauta aleatória sobre um lançamento recente ou clássico cult de música, cinema ou arte visual que se encaixe na estética Visionary/Underground.';
        } else {
            userPrompt = `Gere uma pauta sobre este tópico: "${topic}". Certifique-se de que se encaixa na estética Visionary/Underground.`;
        }

        // --- AI GENERATION ---
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' }
        });

        const data = JSON.parse(completion.choices[0].message.content || '{}');

        if (data.skip) {
            return new Response(JSON.stringify({ error: 'AI skipped this topic as irrelevant', data }), { status: 400 });
        }

        // --- SAVE TO SANITY ---
        const linkHash = crypto.createHash('md5').update(data.title + Date.now()).digest('hex');

        await sanity.createIfNotExists({
            _id: `queue.gen.${linkHash}`,
            _type: 'queue',
            title: data.title,
            body: data.body,
            link: 'https://mixtape252.com/generated', // Placeholder for generated content
            source: 'AI Generator',
            format: (data.format || 'news').toLowerCase(),
            tags: data.tags || ['Generated'],
            aiJson: JSON.stringify(data)
        });

        return new Response(JSON.stringify({ success: true, message: 'Pauta criada na Fila!', title: data.title }), { status: 200 });

    } catch (error: any) {
        console.error('Error generating content:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
    }
};
