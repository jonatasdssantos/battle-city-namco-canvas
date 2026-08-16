type EntityId = number | string
type Entity = { id: EntityId, tags: string[] }

type Components = { entityId: EntityId, components: Record<string, any> }

type System = { execute: (world: World) => void }

export class World {
  
  declare entities: Entity[]
  declare components: Components[]
  declare systems: { id: string, system: System }[]

  constructor() {
    this.entities = []
    this.components = []
    this.systems = []
  }

  //#region Entity management
  addEntity(entityId: EntityId, tags?: string[]) {
    this.entities.push({ id: entityId, tags: tags || [] })
  }

  removeEntity(entityId: EntityId) {
    this.entities = this.entities.filter(e => e.id !== entityId)
  }

  getEntity(entityId: EntityId) {
    return this.entities.find(e => e.id === entityId)
  }

  getEntitiesByComponent<T>(component: string): T[] {
    return this.components.filter(c => c.components[component]).map(c => c.components[component])
  }

  getEntitiesByComponents<T>(components: string[]): T[] {
    return this.components.filter(c => components.every(component => c.components[component])).map(c => c.components as T)
  }

  clearEntities() {
    this.entities = []
  }
  //#endregion

  //#region Component management
  addComponent(entityId: EntityId, componentId: string, value: any) {
    const componentEntry = this.components.find(c => c.entityId === entityId)

    if (componentEntry) {
      componentEntry.components[componentId] = value
    } else {
      this.components.push({ entityId, components: { [componentId]: value } })
    }
  }

  removeComponent(entityId: EntityId, componentId: string) {
    const componentEntry = this.components.find(c => c.entityId === entityId)

    if (componentEntry) {
      delete componentEntry.components[componentId]
    }

    if (Object.keys(componentEntry.components).length === 0) {
      this.components = this.components.filter(c => c.entityId !== entityId)
    }
  }

  getComponent(entityId: EntityId, componentId: string) {
    return this.components.find(c => (c.entityId === entityId && c.components[componentId]))?.components[componentId]
  }

  getComponents(entityId: EntityId): Record<string, any> {
    return this.components.find(c => c.entityId === entityId)?.components || {}
  }

  clearComponents() {
    this.components = []
  }
  //#endregion

  //#region System management
  addSystem(id: string, system: System) {
    this.systems.push({ id, system })
  }

  removeSystem(id: string) {
    this.systems = this.systems.filter(system => system.id !== id)
  }

  clearSystems() {
    this.systems = []
  }
  //#endregion

  update() {
    this.systems.forEach(({ id, system }) => system.execute(this))
  }

  clear() {
    this.clearEntities()
    this.clearComponents()
    this.clearSystems()
  }
}
