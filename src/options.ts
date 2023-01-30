import type { CompileFn } from '@formatjs/cli-lib'
import type { FilterPattern } from '@rollup/pluginutils'

export interface Options {
  /**
   * Either a single glob string or regular expression, or an array of those,
   * that the file ID must match for it to be transformed.
   */
  include?: FilterPattern

  /**
   * Either a single glob string or regular expression, or an array of those,
   * that the file ID must NOT match for it to be transformed.
   */
  exclude?: FilterPattern

  /**
   * Indentation used in the output file.
   *
   * @default '\t'
   */
  indent?: string | number

  /**
   * Either a name of the built-in formatter or function that accepts JSON
   * object from the file and produces a record of messages keyed by their IDs.
   */
  format?: CompileFn | string
}

function normalizeIndent(indent?: Options['indent']) {
  if (indent == null) return '\t'
  return typeof indent === 'number' ? ' '.repeat(indent) : indent
}

export function normalizeOptions(options?: Options) {
  return {
    ...options,
    include: options?.include ?? '*.json',
    indent: normalizeIndent(options?.indent),
    format: options?.format ?? 'default',
  } satisfies Options
}

export type NormalizedOptions = ReturnType<typeof normalizeOptions>
