/**
 * Command Creation Helpers
 * Based on Solana Playground's command creation patterns
 */

import type { Arg, Option, CommandParam, Command } from './types'

/**
 * Create a command
 */
export const createCmd = <
  N extends string,
  A extends Arg[],
  O extends Option[],
  S,
  R
>(
  cmd: CommandParam<N, A, O, S, R>
): Command<N, A, O, S, R> => {
  addHelpOption(cmd)
  return cmd as Command<N, A, O, S, R>
}

/**
 * Create a subcommand
 */
export const createSubcmd = <
  N extends string,
  A extends Arg[],
  O extends Option[],
  S,
  R
>(
  subcmd: CommandParam<N, A, O, S, R>
) => {
  addHelpOption(subcmd)
  return subcmd
}

/**
 * Add built-in help option to commands
 */
const addHelpOption = (cmd: { options?: Option[] }) => {
  cmd.options ??= []
  cmd.options.push({ name: 'help', short: 'h' })
}

/**
 * Create command arguments
 */
export const createArgs = <
  N extends string,
  V extends string,
  A extends Arg<N, V>[]
>(
  args: [...A]
): A => {
  let isOptional = false
  for (const arg of args) {
    if (isOptional && !arg.optional) {
      throw new Error('Optional arguments must come after required arguments')
    }
    if (arg.multiple && arg.name !== args.at(-1)!.name) {
      throw new Error('A multiple value argument must be the last argument')
    }
    if (arg.optional) isOptional = true
  }
  return args
}

/**
 * Create command options
 */
export const createOptions = <
  N extends string,
  V extends string,
  O extends Option<N, V>[]
>(
  opts: [...O]
): O => {
  const createShort = (opt: O[number]) => {
    const short = typeof opt.short === 'string' ? opt.short : opt.name[0]
    if (short.length !== 1) {
      throw new Error(`Short option must be exactly 1 letter: \`${opt.name}\``)
    }
    return short
  }

  for (const opt of opts) {
    if (opt.short) {
      opt.short = createShort(opt)
    }
  }

  return opts
}
