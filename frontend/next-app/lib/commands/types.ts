/**
 * Command System Types
 * Based on Solana Playground's command infrastructure
 */

export type SyncOrAsync<T> = T | Promise<T>
export type Arrayable<T> = T | T[]

export interface Arg<N extends string = string, V extends string = string> {
  name: N
  description?: string
  optional?: boolean
  multiple?: boolean
  values?: V[] | ((token: string, tokens: string[]) => V[])
}

export interface Option<N extends string = string, V extends string = string> {
  name: N
  description?: string
  short?: boolean | string
  takeValue?: boolean
  values?: V[]
}

export interface ParsedInput<A extends Arg[], O extends Option[]> {
  raw: string
  args: ParsedArgs<A>
  options: ParsedOptions<O>
}

type ParsedArgs<A> = A extends [infer Head, ...infer Tail]
  ? Head extends Arg<infer N, infer V>
    ? (Head['optional'] extends true
        ? { [K in N]?: Head['multiple'] extends true ? V[] : V }
        : { [K in N]: Head['multiple'] extends true ? V[] : V }) &
        ParsedArgs<Tail extends Arg[] ? Tail : []>
    : {}
  : {}

type ParsedOptions<O> = O extends [infer Head, ...infer Tail]
  ? Head extends Option<infer N, infer V>
    ? { [K in N]?: Head['takeValue'] extends true ? V : boolean } &
        ParsedOptions<Tail extends Option[] ? Tail : []>
    : {}
  : {}

export type CommandParam<
  N extends string,
  A extends Arg[],
  O extends Option[],
  S,
  R
> = {
  name: N
  description: string
  preCheck?: Arrayable<() => SyncOrAsync<void>>
} & (WithSubcommands<S> | WithHandle<A, O, R>)

type WithSubcommands<S> = {
  args?: never
  options?: never
  handle?: never
  subcommands?: S
}

type WithHandle<A extends Arg[], O extends Option[], R> = {
  args?: A
  options?: O
  handle: (input: ParsedInput<A, O>) => R
  subcommands?: never
}

export type Command<
  N extends string = string,
  A extends Arg[] = Arg[],
  O extends Option[] = Option[],
  S = unknown,
  R = unknown
> = Omit<CommandParam<N, A, O, S, R>, 'subcommands'> & {
  subcommands?: Command[]
}

export interface Disposable {
  dispose(): void
}

export interface CommandEventCallbacks {
  onStart: Array<(input: string | null) => void>
  onFinish: Array<(result: any) => void>
}
