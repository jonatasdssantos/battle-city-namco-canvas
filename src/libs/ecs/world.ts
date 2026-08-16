type Entity = number

type Components = Record<string, any>

type System = { execute: (world: World) => void }

export class World {
  
  declare entities: Entity[]
  declare components: Components
  declare systems: { id: string, system: System }[]

  constructor() {
    this.entities = []
    this.components = {}
    this.systems = []
  }

  //#region Entity management
  addEntity(entity: Entity) {
    this.entities.push(entity)
  }

  removeEntity(entity: Entity) {
    this.entities = this.entities.filter(e => e !== entity)
  }
  //#endregion

  //#region Component management
  addComponent(entity: Entity, component: any) {
    this.components[entity] = { ...this.components[entity], ...component }
  }

  removeComponent(entity: Entity, component: any) {
    delete this.components[entity][component]
  }
  //#endregion

  //#region System management
  addSystem(id: string, system: System) {
    this.systems.push({ id, system })
  }

  removeSystem(id: string) {
    this.systems = this.systems.filter(system => system.id !== id)
  }
  //#endregion

  update() {
    this.systems.forEach(({ id, system }) => system.execute(this))
  }
}
