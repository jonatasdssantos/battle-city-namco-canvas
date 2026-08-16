import { World } from "../libs/ecs/world";

// Systems
import { MovementSystem } from "./systems";

export const PLAYER_ENTITY = 'player_1'

export class App {

  declare isReady: boolean
  declare isRunning: boolean
  declare $playerEl: HTMLElement

  world: World

  constructor() {
    this.init();

    this.$playerEl = document.getElementById('player-debug') as HTMLElement

    console.log(this)
  }

  init() {

    this.initWorld()
    
    // Init Entities
    this.initPlayerEntity()
    
    // Init Keyboard Handlers
    this.initKeyboardHandlers()
    
    this.isReady = true
  }

  initWorld() {
    this.world = new World()

    this.world.addSystem('movement', new MovementSystem())
  }

  initPlayerEntity() {
    this.world.addEntity(PLAYER_ENTITY)

    this.world.addComponent(PLAYER_ENTITY, {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
    })
  }

  initKeyboardHandlers() {
    window.addEventListener('keydown', this.keyDownHandler.bind(this))
    window.addEventListener('keyup', this.keyUpHandler.bind(this))
  }

  keyDownHandler(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        this.world.addComponent(PLAYER_ENTITY, { velocity: { x: -1, y: 0 } })
        break
      case 'ArrowRight':
        this.world.addComponent(PLAYER_ENTITY, { velocity: { x: 1, y: 0 } })
        break
      case 'ArrowUp':
        this.world.addComponent(PLAYER_ENTITY, { velocity: { x: 0, y: -1 } })
        break
      case 'ArrowDown':
        this.world.addComponent(PLAYER_ENTITY, { velocity: { x: 0, y: 1 } })
        break
    }
  }

  keyUpHandler(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        this.world.addComponent(PLAYER_ENTITY, { velocity: { x: 0, y: 0 } })
        break
      case 'ArrowRight':
        this.world.addComponent(PLAYER_ENTITY, { velocity: { x: 0, y: 0 } })
        break
      case 'ArrowUp':
        this.world.addComponent(PLAYER_ENTITY, { velocity: { x: 0, y: 0 } })
        break
      case 'ArrowDown':
        this.world.addComponent(PLAYER_ENTITY, { velocity: { x: 0, y: 0 } })
        break
    }
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

      // Update Player Debug
      const playerPosition = this.world.getComponent(PLAYER_ENTITY, 'position')
      this.$playerEl.style.transform = `translate(${playerPosition.x}px, ${playerPosition.y}px)`
    }
  }
}