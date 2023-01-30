import type { CompileFn } from '@formatjs/cli-lib'
import type { FilterPattern } from '@rollup/pluginutils'

export interface Options {
  /** Inclusion filter. */
  include?: FilterPattern

  /** Exclusion filter. */
  exclude?: FilterPattern

  /**
   * Indentation used in the file.
   *
   * @default '\t'
   */
  indent?: string | number

  /** File extensions that this plugin handles. */
  extensions?: string | string[]

  /**
   * Formatter to use, either a name of the built-in formatter or function to
   * compile the messages.
   */
  format?: CompileFn | string
}

function normalizeIndent(indent?: Options['indent']) {
  if (indent == null) return '\t'
  return typeof indent === 'number' ? ' '.repeat(indent) : indent
}

function normalizeExtensions(extensions?: Options['extensions']) {
  if (extensions == null) return ['.json']
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
