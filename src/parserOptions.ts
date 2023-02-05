import type { ParserOptions } from '@formatjs/icu-messageformat-parser/parser.js'

export const AnyMessage = Symbol('defaultParserOptions')

export type MessagesParsingOptions = Record<
  string | typeof AnyMessage,
  ParserOptions
>

type OptionsResolver = (messageId: string) => ParserOptions | undefined

export function createOptionsResolver(
  options?: MessagesParsingOptions,
): OptionsResolver {
  if (options == null) {
    return function dummyResolver() {
      return undefined
    }
  }

  const normalizedOptions = new Map<string | typeof AnyMessage, ParserOptions>()

  let hasGlobalOptions = false

  if (options[AnyMessage] != null) {
    normalizedOptions.set(AnyMessage, options[AnyMessage])
    hasGlobalOptions = true
  }

  for (const [messageId, parserOptions] of Object.entries(options)) {
    normalizedOptions.set(messageId, parserOptions)
  }

  return function resolve(messageId: string) {
    if (!hasGlobalOptions && !normalizedOptions.has(messageId)) return undefined

    return {
      ...normalizedOptions.get(AnyMessage),
      ...normalizedOptions.get(messageId),
    }
  }
}
