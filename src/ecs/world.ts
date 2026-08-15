import type { Components } from '../components.ts'
import type { ComponentName, Entity, EntityId, With } from './entity.ts'

export class World {
  #entities: Entity[] = []
  #pendingDestroy = new Set<EntityId>()
  #nextId: EntityId = 1

  get entities(): readonly Entity[] {
    return this.#entities
  }

  spawn(components: Partial<Components>): Entity {
    const entity: Entity = { id: this.#nextId++, ...components }
    this.#entities.push(entity)
    return entity
  }

  destroy(entity: Entity): void {
    this.#pendingDestroy.add(entity.id)
  }

  query<K extends ComponentName>(...names: K[]): With<K>[] {
    const matches: With<K>[] = []

    for (const entity of this.#entities) {
      if (this.#pendingDestroy.has(entity.id)) continue
      if (names.some((name) => entity[name] === undefined)) continue
      matches.push(entity as With<K>)
    }

    return matches
  }

  // Removals are applied here, between frames, so a system can never delete an
  // entity another system is still iterating over.
  flush(): void {
    if (this.#pendingDestroy.size === 0) return
    this.#entities = this.#entities.filter((entity) => !this.#pendingDestroy.has(entity.id))
    this.#pendingDestroy.clear()
  }
}
