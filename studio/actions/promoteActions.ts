import { useClient } from 'sanity'
import { useRouter } from 'sanity/router'
import { uuid } from '@sanity/uuid'

export function PromoteToNewsAction(props) {
    const { id, type, draft, published } = props
    const doc = draft || published
    const client = useClient({ apiVersion: '2024-03-01' })
    const router = useRouter()

    if (type !== 'queue') return null

    return {
        label: 'Promover para NEWS 🗞️',
        onHandle: async () => {
            // 1. Criar News Item
            const newId = `news.${uuid()}`
            await client.create({
                _id: newId,
                _type: 'newsItem',
                title: doc.title,
                description: doc.body, // Mapeia body -> description
                link: doc.link,
                source: doc.source,
                date: new Date().toISOString(),
                tags: doc.tags
            })

            // 2. Deletar da Fila
            await client.delete(id)

            // 3. Redirecionar para o novo doc
            router.navigateIntent('edit', { id: newId, type: 'newsItem' })
        }
    }
}

export function PromoteToPostAction(props) {
    const { id, type, draft, published } = props
    const doc = draft || published
    const client = useClient({ apiVersion: '2024-03-01' })
    const router = useRouter()

    if (type !== 'queue') return null

    return {
        label: 'Promover para POST 🚀',
        onHandle: async () => {
            // 1. Criar Post (Draft)
            const newId = `drafts.${uuid()}`

            // Gera slug simples (o editor pode ajustar depois)
            const slug = doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 96)

            await client.create({
                _id: newId,
                _type: 'post',
                title: doc.title,
                slug: { _type: 'slug', current: slug },
                format: 'news', // Padrão
                publishedAt: new Date().toISOString(),
                tags: doc.tags,
                body: [
                    {
                        _type: 'block',
                        children: [{ _type: 'span', text: doc.body }]
                    },
                    {
                        _type: 'block',
                        children: [{ _type: 'span', text: `Fonte: ${doc.source} (${doc.link})` }]
                    }
                ]
            })

            // 2. Deletar da Fila
            await client.delete(id)

            // 3. Redirecionar
            router.navigateIntent('edit', { id: newId, type: 'post' })
        }
    }
}
