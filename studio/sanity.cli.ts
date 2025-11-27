import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'wccgg6vb',
    dataset: 'production'
  },
  deployment: {
    // ID da aplicação no Sanity Hosting (evita prompts interativos)
    appId: 'qb6fmocy2de3g1yfpm3y4t61',

    // Habilita atualizações automáticas do estúdio
    autoUpdates: true,
  }
})
