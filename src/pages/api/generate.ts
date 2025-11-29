import type { APIRoute } from 'astro';
import OpenAI from 'openai';
import { createClient } from '@sanity/client';
import crypto from 'crypto';
import slugify from 'slugify';

// Força a renderização no servidor (SSR) para esta rota
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    console.log('API /api/generate chamada...'); // Log para debug

    try {
        // 1. Carregar Variáveis (Priorizando Astro)
        const projectId = import.meta.env.SANITY_PROJECT_ID || import.meta.env.PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
        const dataset = import.meta.env.SANITY_DATASET || import.meta.env.PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET;
        const token = import.meta.env.SANITY_API_TOKEN || process.env.SANITY_API_TOKEN;
        const openaiKey = import.meta.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

        // Debug no Terminal (mostra status sem revelar segredos)
        console.log('Configuração Carregada:', {
            projectId: projectId ? 'OK' : 'FALTANDO',
            dataset: dataset ? 'OK' : 'FALTANDO',
            token: token ? 'OK' : 'FALTANDO',
            openaiKey: openaiKey ? 'OK' : 'FALTANDO'
        });

        if (!projectId || !token || !openaiKey) {
            throw new Error(`Configuração incompleta no .env. Verifique o terminal.`);
        }

        // 2. Ler o Corpo da Requisição
        const body = await request.json().catch(() => null);
        if (!body) {
            throw new Error('Corpo da requisição inválido ou vazio.');
        }
        const { topic, mode } = body;

        // 3. Configurar Clientes
        const sanity = createClient({
            projectId,
            dataset,
            token,
            useCdn: false,
            apiVersion: '2024-03-01',
        });

        const openai = new OpenAI({ apiKey: openaiKey });

        // 4. Prompt & Geração
        const SYSTEM_PROMPT = `
        Você é o Editor-Chefe da 'Mixtape252'. 
        SUA MISSÃO: Criar pautas de cultura visual/sonora de ALTA QUALIDADE.
        ESTILO: Jornalístico, ácido, técnico. Sem gírias forçadas. Use títulos diretos.
        FORMATO JSON: { "title": "...", "body": "...", "tags": [], "format": "article" }
        `;

        const userPrompt = mode === 'random'
            ? 'Gere uma pauta aleatória sobre um clássico cult, movimento underground ou estética visual esquecida.'
            : `Gere uma pauta jornalística sobre: "${topic}".`;

        console.log('Perguntando para a IA...');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' }
        });

        const data = JSON.parse(completion.choices[0].message.content || '{}');
        console.log('IA Respondeu:', data.title);

        // 5. Salvar DIRETO COMO RASCUNHO (Skip Queue)
        const slug = slugify(data.title, { lower: true, strict: true }).slice(0, 90);
        const draftId = `drafts.gen.${crypto.createHash('md5').update(data.title).digest('hex')}`;

        await sanity.createIfNotExists({
            _id: draftId,
            _type: 'post', // Agora é um Post real
            title: data.title,
            slug: { _type: 'slug', current: slug },
            format: 'article', // Pautas manuais geralmente são artigos/ensaios
            tags: data.tags || ['Original'],
            publishedAt: new Date().toISOString(),
            body: [
                {
                    _type: 'block',
                    children: [{ _type: 'span', text: data.body }]
                }
            ]
        });

        console.log('Salvo no Sanity com sucesso.');

        return new Response(JSON.stringify({ success: true, title: data.title }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('❌ Erro na API:', error);
        // Retorna o erro como JSON para o frontend não quebrar com "Unexpected end of JSON"
        return new Response(JSON.stringify({
            error: error.message || 'Erro interno no servidor',
            details: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
