import { World } from "../libs/ecs/world";

export class App {

  declare isReady: boolean
  declare isRunning: boolean

  world: World

  constructor() {
    this.init();
  }

  init() {
    this.world = new World()
    this.isReady = true
  }

  start() {
    this.isRunning = true
  }

  stop() {
    this.isRunning = false
  }

  update() {
    if (this.isRunning && this.isReady) {
      this.world.update()
    }
  }
}