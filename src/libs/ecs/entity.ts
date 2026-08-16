import type { Components } from '../../components.ts'

export type EntityId = number

export type ComponentName = keyof Components

export type Entity = { id: EntityId } & Partial<Components>

/** An entity where the listed components are guaranteed present. */
export type With<K extends ComponentName> = { id: EntityId } &
  Partial<Components> &
  Required<Pick<Components, K>>
