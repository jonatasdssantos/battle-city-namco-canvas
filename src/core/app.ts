import { World } from "miniplex";
import mitt from "../libs/emitter";

import type { Dimensions, EnemyLevel, Entity, GameWorld, PowerUpType, Vector } from "../components";

// Systems
import { 
  EnemiesAISystem,
  MovementSystem, 
  ProjectileSystem,
  CollisionDetectionSystem,
  PowerUpSystem
} from './systems';

export type EmitterEvents = {
  'player.death': { player: Entity },
  'player.hit': { player: Entity },
  'player.spawn': { player: Entity },

  'enemy.spawn': { enemy: Entity },
  'enemy.hit': { enemy: Entity },
  'enemy.death': { enemy: Entity },

  'projectile.spawn': { projectile: Entity },
  'projectile.hit': { projectile: Entity, target: Entity },

  'powerup.spawn': { powerup: Entity },
  'powerup.hit': { powerup: Entity, player: Entity }
  'powerup.expired': { powerup: Entity }
}

export const Emitter = mitt<EmitterEvents>()

const ENEMY_HEALTH: Record<EnemyLevel, number> = { '1': 1, '2': 2, '3': 3 }

type System = { execute: (world: GameWorld) => void }

export class App {

  declare isReady: boolean
  declare isRunning: boolean

  declare $appEl: HTMLElement

  declare windowMidWidth: number
  declare windowMidHeight: number
  
  declare world: GameWorld
  declare systems: System[]
  declare player: Entity

  constructor() {
    this.$appEl = document.getElementById('app') as HTMLElement

    this.windowMidWidth = window.innerWidth / 2
    this.windowMidHeight = window.innerHeight / 2

    this.init();

    console.log(this)
  }

  init() {

    this.initWorld()
    
    // Init Entities
    this.initPlayerEntity()

    this.initWallEntity({ x: this.windowMidWidth, y: this.windowMidHeight }, { width: 100, height: 100, depth: 0 })
    this.initWallEntity({ x: this.windowMidWidth, y: 50 }, { width: 50, height: 50, depth: 0 })
    this.initWallEntity({ x: this.windowMidWidth + 200, y: this.windowMidHeight - 150 }, { width: 50, height: 350, depth: 0 })
    this.initWallEntity({ x: this.windowMidWidth - 300, y: this.windowMidHeight }, { width: 100, height: 100, depth: 0 })

    this.initEnemyEntity({ x: this.windowMidWidth * 0.5, y: this.windowMidHeight * 0.2 }, '2')
    this.initEnemyEntity({ x: this.windowMidWidth * 1.5, y: this.windowMidHeight * 1.4 }, '2')
    this.initEnemyEntity({ x: this.windowMidWidth * 0.3, y: this.windowMidHeight * 1.5 }, '2')
    this.initEnemyEntity({ x: this.windowMidWidth * 1.3, y: this.windowMidHeight * 0.5 }, '3')
    this.initEnemyEntity({ x: this.windowMidWidth * 0.3, y: this.windowMidHeight * 0.8 }, '2')
    this.initEnemyEntity({ x: this.windowMidWidth * 1.3, y: this.windowMidHeight * 0.2 }, '1')

    this.initPowerupEntity({ x: 50, y: 50 }, 'health')
    
    // Init Keyboard Handlers
    this.initKeyboardHandlers()

    // Init Emitter Event Listeners
    Emitter.on('enemy.death', this.observeEnemyDeathHandler.bind(this))
    Emitter.on('player.death', this.observePlayerDeathHandler.bind(this))
    Emitter.on('projectile.hit', this.observeProjectileHitHandler.bind(this))
    Emitter.on('powerup.hit', this.observePowerupHandler.bind(this))
    Emitter.on('powerup.expired', this.observePowerupExpiredHandler.bind(this))

    this.isReady = true
  }

  initWorld() {
    this.world = new World<Entity>()

    this.world.onEntityRemoved.subscribe(entity => entity.sprite?.remove())

    this.systems = [
      new EnemiesAISystem(),
      new MovementSystem(),
      new ProjectileSystem(),
      new PowerUpSystem(),
      new CollisionDetectionSystem()
    ]
  }

  //#region Entity Initialization
  initPlayerEntity() {
    const dimensions = { width: 25, height: 25, depth: 0 }

    this.player = this.world.add({
      player: true,
      movable: true,
      collidable: true,
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      direction: { x: 0, y: 0 },
      health: 1,
      dimensions,
      bbox: { ...dimensions },
      score: 0,
      powerups: [],
      sprite: document.getElementById('player-debug') ?? undefined
    })
  }

  initEnemyEntity(position: Vector, level: EnemyLevel) {
    const dimensions = { width: 20, height: 20, depth: 0 }

    this.world.add({
      enemy: true,
      movable: true,
      collidable: true,
      position: { ...position },
      velocity: { x: 0, y: 0 },
      direction: { x: 0, y: 0 },
      health: ENEMY_HEALTH[level],
      dimensions,
      bbox: { ...dimensions },
      level,
      special: false,
      sprite: this.createSprite('enemy', position, dimensions)
    })
  }

  initWallEntity(position: Vector, dimensions: Dimensions) {
    this.world.add({
      wall: true,
      static: true,
      collidable: true,
      position: { ...position },
      dimensions: { ...dimensions },
      bbox: { ...dimensions },
      sprite: this.createSprite('wall', position, dimensions)
    })
  }

  initProjectileEntity(owner: Entity) {
    if (!this.world.has(owner) || !owner.position || !owner.direction || !owner.dimensions) return

    const dimensions = { width: 10, height: 10, depth: 0 }

    const middlePosX = (owner.dimensions.width / 2) + (dimensions.width / 2)
    const middlePosY = (owner.dimensions.height / 2) + (dimensions.height / 2)

    const position = { x: owner.position.x + middlePosX, y: owner.position.y + middlePosY }

    this.world.add({
      projectile: true,
      movable: true,
      collidable: true,
      position,
      velocity: { x: 5, y: 5 },
      direction: { ...owner.direction },
      dimensions,
      bbox: { ...dimensions },
      damage: 1,
      owner,
      sprite: this.createSprite('projectile', position, dimensions)
    })
  }

  initPowerupEntity(position: Vector, type: PowerUpType) {
    const dimensions = { width: 10, height: 10, depth: 0 }

    const pos = PowerUpSystem.findAvailablePosition(position, dimensions, this.world)

    if (!pos) return

    this.world.add({
      powerup: true,
      static: true,
      collidable: true,
      position: pos,
      dimensions,
      bbox: { ...dimensions },
      powerupType: type,
      durationOnMap: 10,
      expired: false,
      pickedUp: false,
      activated: false,
      owner: null,
      sprite: this.createSprite('powerup', pos, dimensions)
    })
  }
  //#endregion

  //#region Keyboard Handlers
  initKeyboardHandlers() {
    window.addEventListener('keydown', this.keyDownHandler.bind(this))
    window.addEventListener('keyup', this.keyUpHandler.bind(this))
  }

  keyDownHandler(event: KeyboardEvent) {
    const { velocity } = this.player

    if (!velocity) return

    switch (event.code) {
      case 'ArrowLeft':
        velocity.x = -3
        this.player.direction = { x: -1, y: 0 }
        break
      case 'ArrowRight':
        velocity.x = 3
        this.player.direction = { x: 1, y: 0 }
        break
      case 'ArrowUp':
        velocity.y = -3
        this.player.direction = { x: 0, y: -1 }
        break
      case 'ArrowDown':
        velocity.y = 3
        this.player.direction = { x: 0, y: 1 }
        break
      case 'Space':
        this.initProjectileEntity(this.player)
        break
    }
  }

  keyUpHandler(event: KeyboardEvent) {
    const { velocity } = this.player

    if (!velocity) return

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        velocity.x = 0
        break
      case 'ArrowUp':
      case 'ArrowDown':
        velocity.y = 0
        break
    }
  }
  //#endregion

  //#region Handlers
  createSprite(className: string, position: Vector, dimensions: Dimensions) {
    const $el = document.createElement('div')
    $el.className = className
    $el.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`
    $el.style.width = `${dimensions.width}px`
    $el.style.height = `${dimensions.height}px`

    this.$appEl.appendChild($el)

    return $el
  }

  handleEnemyShooting() {
    for (const enemy of this.world.with('enemy', 'shootRequested')) {
      this.initProjectileEntity(enemy)

      this.world.removeComponent(enemy, 'shootRequested')
    }
  }

  renderSprites() {
    for (const { sprite, position } of this.world.with('sprite', 'position')) {
      sprite.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`
    }
  }
  //#endregion

  //#region Observe Events
  observeEnemyDeathHandler(event: EmitterEvents['enemy.death']) {
    console.log('enemy death', event)

    this.player.score = (this.player.score ?? 0) + 100 // WIP
  }

  observeProjectileHitHandler(event: EmitterEvents['projectile.hit']) {
    console.log('projectile hit', event)
  }

  observePlayerDeathHandler(event: EmitterEvents['player.death']) {
    console.log('player death', event)
  }

  observePowerupHandler(event: EmitterEvents['powerup.hit']) {
    console.log('powerup hit', event)

    this.player.score = (this.player.score ?? 0) + 250 // WIP
  }

  observePowerupExpiredHandler(event: EmitterEvents['powerup.expired']) {
    console.log('powerup expired event', event)
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
      this.systems.forEach(system => system.execute(this.world))

      this.renderSprites()
      this.handleEnemyShooting()
    }
  }
}
