import type { CompileFn } from '@formatjs/cli-lib'
import type { FilterPattern } from '@rollup/pluginutils'

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
   * Unstable options that should be used with caution.
   *
   * @alpha
   */
  experimental?: {
    /**
     * Whether to wrap all known JSON plugins to prevent them from transforming
     * the files that would be handled by this plugin.
     *
     * Some plugins, like Vite's JSON plugin do not provide configuration
     * options to exclude files, so this option might be necessary.
     *
     * @default false // No wrapping.
     * @alpha
     */
    wrapJSONPlugins?: boolean
  }
}

function normalizeIndent(indent?: Options['indent']) {
  if (indent == null) return '\t'
  return typeof indent === 'number' ? ' '.repeat(indent) : indent
}

function normalizeExperimentalOptions(options?: Options['experimental']) {
  return {
    wrapJSONPlugins: options?.wrapJSONPlugins ?? false,
  } satisfies Options['experimental']
}

export function normalizeOptions(options?: Options) {
  return {
    ...options,
    include: options?.include ?? '**/*.messages.json',
    indent: normalizeIndent(options?.indent),
    format: options?.format ?? 'default',
    experimental: normalizeExperimentalOptions(options?.experimental),
  } satisfies Options
}

export type NormalizedOptions = ReturnType<typeof normalizeOptions>
