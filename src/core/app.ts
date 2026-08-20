import { World } from "../libs/ecs/world";

// Systems
import { MovementSystem } from "./systems";

export const PLAYER_ENTITY = 'player_1'

//*
// Todo: implement components as struct data types, instead of playing with strings with objects
//  */

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

  //#region Entity Initialization
  initPlayerEntity() {
    this.world.addEntity(PLAYER_ENTITY)

    this.world.addComponent(PLAYER_ENTITY, 'position', { x: 0, y: 0 })
    this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 0, y: 0 })
    this.world.addComponent(PLAYER_ENTITY, 'health', { value: 100 })
    this.world.addComponent(PLAYER_ENTITY, 'dimensions', { width: 10, height: 10 })
    this.world.addComponent(PLAYER_ENTITY, 'bbox', { width: 10, height: 10 })
  }

  initEnemyEntity() {
    const enemyId = this.world.addEntity('enemy', true)

    this.world.addComponent(enemyId, 'position', { x: 0, y: 0 })
    this.world.addComponent(enemyId, 'velocity', { x: 0, y: 0 })
    this.world.addComponent(enemyId, 'health', { value: 100 })
    this.world.addComponent(enemyId, 'dimensions', { width: 10, height: 10 })
    this.world.addComponent(enemyId, 'bbox', { width: 10, height: 10 })
  }

  initWallEntity() {
    const wallId = this.world.addEntity('wall', true)

    this.world.addComponent(wallId, 'position', { x: 0, y: 0 })
    this.world.addComponent(wallId, 'dimensions', { width: 10, height: 10 })
    this.world.addComponent(wallId, 'bbox', { width: 10, height: 10 })
  }

  initProjectileEntity() {
    const projectileId = this.world.addEntity('projectile', true)

    this.world.addComponent(projectileId, 'position', { x: 0, y: 0 })
    this.world.addComponent(projectileId, 'velocity', { x: 0, y: 0 })
    this.world.addComponent(projectileId, 'dimensions', { width: 10, height: 10 })
    this.world.addComponent(projectileId, 'bbox', { width: 10, height: 10 })
    this.world.addComponent(projectileId, 'damage', { value: 10 })
    this.world.addComponent(projectileId, 'owner', { value: PLAYER_ENTITY })
  }

  initPowerupEntity() {
    const powerupId = this.world.addEntity('powerup', true)

    this.world.addComponent(powerupId, 'position', { x: 0, y: 0 })
    this.world.addComponent(powerupId, 'dimensions', { width: 10, height: 10 })
    this.world.addComponent(powerupId, 'bbox', { width: 10, height: 10 })
  }
  //#endregion

  //#region Keyboard Handlers
  initKeyboardHandlers() {
    window.addEventListener('keydown', this.keyDownHandler.bind(this))
    window.addEventListener('keyup', this.keyUpHandler.bind(this))
  }

  keyDownHandler(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: -1, y: 0 })
        break
      case 'ArrowRight':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 1, y: 0 })
        break
      case 'ArrowUp':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 0, y: -1 })
        break
      case 'ArrowDown':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 0, y: 1 })
        break
    }
  }

  keyUpHandler(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 0, y: 0 })
        break
      case 'ArrowRight':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 0, y: 0 })
        break
      case 'ArrowUp':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 0, y: 0 })
        break
      case 'ArrowDown':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 0, y: 0 })
        break
    }
  }
  //#endregion

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
      this.$playerEl.style.transform = `translate3d(${playerPosition.x}px, ${playerPosition.y}px, 0)`
    }
  }
}