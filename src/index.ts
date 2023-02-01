import { createFilter, dataToEsm } from '@rollup/pluginutils'
import type { Plugin } from 'rollup'
import {
  type MessageFormatElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import type { CompileFn } from '@formatjs/cli-lib'
import { normalizeOptions, type Options } from './options.js'
import { resolveCompileFunction } from './compiling.js'

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
  const { indent, format, ...options } = normalizeOptions(options_)

  const filter = createFilter(options.include, options.exclude)

  let compileFunc: CompileFn | undefined

  return {
    name: 'icu-messages',
    async options() {
      compileFunc = await resolveCompileFunction(format)

      return null
    },
    transform(code, id) {
      if (compileFunc == null) {
        throw new TransformError(
          'Compiler function is missing after options hook call',
        )
      }

      if (!filter(id)) return null

      let json: any

      try {
        json = JSON.parse(code)
      } catch (cause) {
        let msg = `Cannot transform "${id}" due to ${String(cause)}`

        if (isProbablyTransformedAlready(code)) {
          msg +=
            '. It appears that this file has already been transformed. Ensure that no other plugin parses this file. If you use `@rollup/plugin-json`, make sure to exclude through options all files that are transformed by this plugin.'
        }

        throw new TransformError(msg, { cause })
      }

      const out: Record<string, MessageFormatElement[]> = Object.create(null)

      let messages: unknown
      try {
        messages = compileFunc(json)
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

      for (const [key, message] of Object.entries(messages)) {
        if (typeof message !== 'string') {
          throw new TransformError(`Value under key "${key}" is not a string`)
        }

        try {
          out[key] = parse(message)
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

export default icuMessages
