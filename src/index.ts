import { createFilter, dataToEsm } from '@rollup/pluginutils'
import type { Plugin } from 'rollup'
import {
  type MessageFormatElement,
  parse as parseMessage,
} from '@formatjs/icu-messageformat-parser'
import type { CompileFn } from '@formatjs/cli-lib'
import { normalizeOptions, type Options } from './options.js'
import { resolveCompileFunction } from './compiling.js'
import { createOptionsResolver } from './parserOptions.js'

class TransformError extends Error {
  public readonly code = 'ROLLUP_ICU_TRANSFORM_ERROR'
}

function isProbablyTransformedAlready(code: string) {
  const trimmed = code.trim()
  for (const badToken of ['const', 'let', 'var', 'export', 'import']) {
    if (trimmed.startsWith(badToken)) return true
  }
  return false // just invalid json
}

function icuMessages(options_: Options = {}): Plugin {
  const { indent, format, parse, experimental, ...options } =
    normalizeOptions(options_)

  const filter = createFilter(options.include, options.exclude)

  const getParserOptions = createOptionsResolver(options.parserOptions)

  let compileFunc: CompileFn | undefined

  return {
    name: 'icu-messages',
    async options() {
      compileFunc = await resolveCompileFunction(format)

      return null
    },
    async buildStart(options) {
      if (!experimental.wrapJSONPlugins) return

      const { pluginWrappers } = await import('./pluginWrappers.js')

      for (const [pluginName, wrap] of Object.entries(pluginWrappers)) {
        const plugin = options.plugins.find(
          (plugin) => plugin.name === pluginName,
        )

        if (plugin == null) continue

        wrap(plugin, filter)
      }
    },
    transform(code, id) {
      if (compileFunc == null) {
        throw new TransformError(
          'Compiler function is missing after options hook call',
        )
      }

      if (!filter(id)) return null

      let inputValue: any

      try {
        inputValue = parse(code, id)
      } catch (cause) {
        let msg = `Cannot transform "${id}" due to ${String(cause)}`

        if (isProbablyTransformedAlready(code)) {
          msg +=
            '. It appears that this file has already been transformed. Ensure that no other plugin parses this file. If you use `@rollup/plugin-json`, make sure to exclude through options all files that are transformed by this plugin.'
        }

        throw new TransformError(msg, { cause })
      }

      let messages: unknown
      try {
        messages = compileFunc(inputValue)
      } catch (cause) {
        throw new TransformError(
          `Cannot compile the messages using the selected formatter: ${String(
            cause,
          )}`,
          { cause },
        )
      }

      if (messages == null || typeof messages !== 'object') {
        throw new TransformError(
          'Value returned by the formatter is not an object',
        )
      }

      const out: Record<string, MessageFormatElement[]> = Object.create(null)

      for (const [key, message] of Object.entries(messages)) {
        if (typeof message !== 'string') {
          throw new TransformError(`Value under key "${key}" is not a string`)
        }

        try {
          out[key] = parseMessage(message, getParserOptions(key))
        } catch (cause) {
          throw new TransformError(
            `Cannot parse message under key "${key}": ${String(cause)}`,
          )
        }
      }

      return {
        code: dataToEsm(out, {
          indent,
          preferConst: true,
        }),
        map: { mappings: '' },
      }
    },
  }
}

export { AnyMessage } from './parserOptions.js'

export { icuMessages }
