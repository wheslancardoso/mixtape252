import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'
import { PromoteToNewsAction, PromoteToPostAction } from './actions/promoteActions'

export default defineConfig({
  name: 'default',
  title: 'mixtape252',

  projectId: 'wccgg6vb',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'queue') {
        return [PromoteToNewsAction, PromoteToPostAction, ...prev]
      }
      return prev
    },
  },
})
