import type { ObjectHook, Plugin, RollupWarning, TransformHook } from 'rollup'
import { isAPI } from './api.js'
import { basePluginName } from './shared.js'

export type FilterFunction = (id: string) => boolean

export type PluginWrapper = (plugin: Plugin, filter: FilterFunction) => void

type WrappersMap = Record<string, PluginWrapper>

interface Options {
  /** Whether to extend defaults. */
  extendDefaults?: boolean

  /** Map of wrappers. */
  wrappers?: WrappersMap
}

type WarningFunction = (warning: RollupWarning) => void

class APIMissmatchError extends Error {
  public readonly code = 'ROLLUP_ICU_WRAP_API_MISMATCH'
}

function collectFilters(
  plugins: Plugin[],
  onWarn?: WarningFunction,
): FilterFunction[] {
  const filters: FilterFunction[] = []

  for (let i = 0, l = plugins.length; i < l; i++) {
    const plugin = plugins[i]

    if (plugin.name === basePluginName) {
      if (!isAPI(plugin.api)) {
        onWarn?.(
          new APIMissmatchError(
            'Skipped a plugin which matches our name, but has invalid API',
          ),
        )

        continue
      }

      filters.push(plugin.api.filter)
    }
  }

  return filters
}

function createMegaFilter(filters: FilterFunction[]): FilterFunction {
  return function anyMatches(id) {
    return filters.some((filter) => filter(id))
  }
}

type WrapperQueryFunction = (pluginName: string) => PluginWrapper | undefined

class PluginIneffectiveError extends Error {
  public readonly code = 'ROLLUP_ICU_WRAP_USELESS'
}

function isEmptyObject(value?: Record<string, any>): boolean {
  if (value == null) return true

  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) return false
  }

  return true
}

export function wrapTransform(plugin: Plugin, filter: (id: string) => boolean) {
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

function createWrapResolver(
  wrappers?: WrappersMap,
  inheritDefaults = true,
  onWarn?: WarningFunction,
): WrapperQueryFunction {
  if (!inheritDefaults && isEmptyObject(wrappers)) {
    onWarn?.(
      new PluginIneffectiveError(
        'Your configuration does not make use of defaults and does not provide any other wrappers. This transform wrap plugin will be ineffective and probably could be removed.',
      ),
    )

    return function dummyResolver() {
      return undefined
    }
  }

  const defaults: WrappersMap | null = inheritDefaults
    ? {
        json: wrapTransform,
        'vite:json': wrapTransform,
      }
    : null

  return function resolveWrapper(pluginName) {
    return wrappers?.[pluginName] ?? defaults?.[pluginName]
  }
}

export function icuMessagesWrapPlugins(options?: Options): Plugin {
  return {
    name: `${basePluginName}:plugins-wrapper`,
    buildStart({ plugins }) {
      const resolveWrapper = createWrapResolver(
        options?.wrappers,
        options?.extendDefaults,
        this.warn,
      )

      const filter = createMegaFilter(collectFilters(plugins, this.warn))

      for (const plugin of plugins) {
        const wrap = resolveWrapper(plugin.name)

        if (wrap != null) wrap(plugin, filter)
      }
    },
  }
}
