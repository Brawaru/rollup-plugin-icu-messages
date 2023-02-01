import type { ObjectHook, Plugin, TransformHook } from 'rollup'

function wrapTransform(plugin: Plugin, filter: (id: string) => boolean) {
  const originalTransform = plugin.transform
  if (originalTransform != null) {
    if (typeof originalTransform === 'object') {
      const handler = originalTransform.handler
      return {
        ...originalTransform,
        handler(code, id) {
          if (filter(id)) return null as ReturnType<TransformHook>

          return handler.call(this, id, code) as ReturnType<TransformHook>
        },
      } satisfies ObjectHook<TransformHook>
    } else {
      plugin.transform = function wrappedTransform(code, id) {
        if (filter(id)) return null

        return originalTransform.call(this, code, id)
      }
    }
  }
}

type FilterFunction = (id: string) => boolean

type PluginWrapper = (plugin: Plugin, filter: FilterFunction) => void

export const pluginWrappers: Record<string, PluginWrapper> = {
  json: wrapTransform,
  'vite:json': wrapTransform,
}
