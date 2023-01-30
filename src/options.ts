import type { CompileFn } from '@formatjs/cli-lib'
import type { FilterPattern } from '@rollup/pluginutils'

export interface Options {
  /**
   * Either a single glob string or regular expression, or an array of those,
   * that the file ID must match for it to be transformed.
   *
   * When specified, {@link extensions} option becomes ineffective.
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
   * File extensions that this plugin handles.
   *
   * Ineffective if {@link include} option is specified.
   *
   * Value of `null` disables the file extension check.
   */
  extensions?: null | string | string[]

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

function normalizeExtensions(extensions?: Options['extensions']) {
  if (typeof extensions === 'undefined') return ['.json']
  if (extensions == null) return null
  return Array.isArray(extensions) ? extensions : [extensions]
}

function normalizeFormat(format?: Options['format']) {
  return format == null ? 'default' : format
}

export function normalizeOptions(options?: Options) {
  return {
    ...options,
    extensions: normalizeExtensions(options?.extensions),
    indent: normalizeIndent(options?.indent),
    format: normalizeFormat(options?.format),
  } satisfies Options
}

export type NormalizedOptions = ReturnType<typeof normalizeOptions>
