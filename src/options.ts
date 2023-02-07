import type { CompileFn } from '@formatjs/cli-lib'
import type { FilterPattern } from '@rollup/pluginutils'
import type { MessagesParsingOptions } from './parserOptions.js'

export interface Options {
  /**
   * Either a single glob string or regular expression, or an array of those,
   * that the file ID must match for it to be transformed.
   *
   * @default '**\\/*.json' // Any JSON files.
   */
  include?: FilterPattern

  /**
   * Either a single glob string or regular expression, or an array of those,
   * that the file ID must NOT match for it to be transformed.
   *
   * @default undefined // No exclusions.
   */
  exclude?: FilterPattern

  /**
   * Indentation used in the output file.
   *
   * @default '\t' // Single tab.
   */
  indent?: string | number

  /**
   * Either a name of the built-in formatter or function that accepts JSON
   * object from the file and produces a record of messages keyed by their IDs.
   *
   * @default 'default'
   */
  format?: CompileFn | string

  /**
   * Function that accepts the file contents and parses it to a JavaScript value
   * that will be passed to the {@link format} function (or resolved built-in
   * formatter).
   *
   * This can come in handy when you don't use standard JSON, but something like
   * JSON5, YAML or TOML. Other plugins that process files of these formats must
   * be configured to exclude files that should be transformed by this plugin,
   * otherwise the provided `code` will be raw JavaScript.
   *
   * @default (code) => JSON.parse(code)
   * @param code Raw contents of the file that need to be parsed.
   * @param id ID of the file.
   * @returns The result of parsing the code.
   */
  parse?(code: string, id: string): void

  /**
   * An object which keys are message IDs and values are parsing options for
   * those messages.
   */
  parserOptions?: MessagesParsingOptions
}

function normalizeIndent(indent?: Options['indent']) {
  if (indent == null) return '\t'
  return typeof indent === 'number' ? ' '.repeat(indent) : indent
}

export function normalizeOptions(options?: Options) {
  return {
    ...options,
    include: options?.include ?? '**/*.messages.json',
    indent: normalizeIndent(options?.indent),
    format: options?.format ?? 'default',
    parse: options?.parse ?? ((code) => JSON.parse(code)),
  } satisfies Options
}

export type NormalizedOptions = ReturnType<typeof normalizeOptions>
