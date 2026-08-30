import { World } from "../libs/ecs/world";
import mitt from "../libs/emitter";

// Systems
import { 
  EnemiesAISystem,
  MovementSystem, 
  ProjectileSystem,
  CollisionDetectionSystem
} from './systems';


export const PLAYER_ENTITY = 'player_1'

//*
// Todo: implement components as struct data types, instead of playing with strings with objects
// Todo: implement the entity handlers as a separate class, so we can easily add more entities to the world
//  */

export type EmitterEvents = {
  'player.death': { playerId: string },
  'player.hit': { playerId: string },
  'player.spawn': { playerId: string },

  'enemy.spawn': { enemyId: string },
  'enemy.hit': { enemyId: string },
  'enemy.death': { enemyId: string },

  'projectile.spawn': { projectileId: string },
  'projectile.hit': { projectileId: string, targetId: string },

  'powerup.spawn': { powerupId: string },
  'powerup.hit': { powerupId: string }
}

export const Emitter = mitt<EmitterEvents>()

export class App {

  declare isReady: boolean
  declare isRunning: boolean

  declare $appEl: HTMLElement
  declare $playerEl: HTMLElement
  declare $projectilesEl: HTMLElement[]
  declare $wallsEl: HTMLElement[]
  declare $enemiesEl: HTMLElement[]
  declare $powerupsEl: HTMLElement[]

  declare windowMidWidth: number
  declare windowMidHeight: number
  
  declare world: World

  constructor() {
    this.$appEl = document.getElementById('app') as HTMLElement
    this.$playerEl = document.getElementById('player-debug') as HTMLElement
    
    this.$projectilesEl = []
    this.$wallsEl = []
    this.$enemiesEl = []
    this.$powerupsEl = []

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
    
    // Init Keyboard Handlers
    this.initKeyboardHandlers()

    // Init Emitter Event Listeners
    Emitter.on('enemy.death', this.observeEnemyDeathHandler.bind(this))
    Emitter.on('player.death', this.observePlayerDeathHandler.bind(this))
    Emitter.on('projectile.hit', this.observeProjectileHitHandler.bind(this))

    this.isReady = true
  }

  initWorld() {
    this.world = new World()

    this.world.addSystem('enemiesAI', new EnemiesAISystem())
    this.world.addSystem('movement', new MovementSystem())
    this.world.addSystem('projectile', new ProjectileSystem())
    this.world.addSystem('collision', new CollisionDetectionSystem())
  }

  //#region Entity Initialization
  initPlayerEntity() {
    this.world.addEntity(PLAYER_ENTITY, false, ['player', 'movable', 'collidable'])

    this.world.addComponent(PLAYER_ENTITY, 'position', { x: 0, y: 0 })
    this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 0, y: 0 })
    this.world.addComponent(PLAYER_ENTITY, 'direction', { x: 0, y: 0 })
    this.world.addComponent(PLAYER_ENTITY, 'health', { value: 1 })
    this.world.addComponent(PLAYER_ENTITY, 'dimensions', { width: 25, height: 25, depth: 0 })
    this.world.addComponent(PLAYER_ENTITY, 'bbox', { width: 25, height: 25, depth: 0 })
  }

  initEnemyEntity(position: { x: number, y: number }, level: '1' | '2' | '3') {
    const enemyId = this.world.addEntity('enemy', true, ['enemy', 'movable', 'collidable'])

    let health = 1

    switch (level) {
      case '1':
        health = 1
        break;
      case '2':
        health = 2
        break;
      case '3':
        health = 3
        break;
    }

    this.world.addComponent(enemyId, 'position', position)
    this.world.addComponent(enemyId, 'velocity', { x: 0, y: 0 })
    this.world.addComponent(enemyId, 'direction', { x: 0, y: 0 })
    this.world.addComponent(enemyId, 'health', { value: health })
    this.world.addComponent(enemyId, 'dimensions', { width: 20, height: 20, depth: 0 })
    this.world.addComponent(enemyId, 'bbox', { width: 20, height: 20, depth: 0 })
    this.world.addComponent(enemyId, 'level', { value: level })

    // WIP
    this.handleEnemyCreation(enemyId)
  }

  initWallEntity(position: { x: number, y: number }, dimensions: { width: number, height: number, depth: number }) {
    const wallId = this.world.addEntity('wall', true, ['wall', 'static', 'collidable'])

    this.world.addComponent(wallId, 'position', position)
    this.world.addComponent(wallId, 'dimensions', dimensions)
    this.world.addComponent(wallId, 'bbox', dimensions)

    // WIP
    this.handleWallCreation(wallId)
  }

  initProjectileEntity( ownerEntityId: string ) {
    const projectileId = this.world.addEntity('projectile', true, ['projectile', 'movable', 'collidable'])
    
    const ownerDirection = this.world.getComponent(ownerEntityId, 'direction')
    const ownerPosition = this.world.getComponent(ownerEntityId, 'position')
    const ownerDimensions = this.world.getComponent(ownerEntityId, 'dimensions')

    const dimensions = { width: 10, height: 10, depth: 0 }

    const middlePosX = (ownerDimensions.width / 2) + (dimensions.width / 2)
    const middlePosY = (ownerDimensions.height / 2) + (dimensions.height / 2)

    this.world.addComponent(projectileId, 'position', { x: ownerPosition.x + middlePosX, y: ownerPosition.y + middlePosY })
    this.world.addComponent(projectileId, 'velocity', { x: 5, y: 5 })
    this.world.addComponent(projectileId, 'direction', { x: ownerDirection.x, y: ownerDirection.y })
    this.world.addComponent(projectileId, 'dimensions', dimensions)
    this.world.addComponent(projectileId, 'bbox', dimensions)
    this.world.addComponent(projectileId, 'damage', { value: 1 })
    this.world.addComponent(projectileId, 'owner', { value: ownerEntityId })

    // WIP
    this.handleProjectileCreation(projectileId)
  }

  initPowerupEntity() {
    const powerupId = this.world.addEntity('powerup', true, ['powerup', 'static', 'collidable'])

    this.world.addComponent(powerupId, 'position', { x: 0, y: 0 })
    this.world.addComponent(powerupId, 'dimensions', { width: 10, height: 10, depth: 0 })
    this.world.addComponent(powerupId, 'bbox', { width: 10, height: 10, depth: 0 })
  }
  //#endregion

  //#region Keyboard Handlers
  initKeyboardHandlers() {
    window.addEventListener('keydown', this.keyDownHandler.bind(this))
    window.addEventListener('keyup', this.keyUpHandler.bind(this))
  }

  keyDownHandler(event: KeyboardEvent) {
    switch (event.code) {
      case 'ArrowLeft':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: -3})
        this.world.addComponent(PLAYER_ENTITY, 'direction', { x: -1, y: 0 })
        break
      case 'ArrowRight':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 3})
        this.world.addComponent(PLAYER_ENTITY, 'direction', { x: 1, y: 0 })
        break
      case 'ArrowUp':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { y: -3 })
        this.world.addComponent(PLAYER_ENTITY, 'direction', { x: 0, y: -1 })
        break
      case 'ArrowDown':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { y: 3 })
        this.world.addComponent(PLAYER_ENTITY, 'direction', { x: 0, y: 1 })
        break
      case 'Space':
        this.initProjectileEntity(PLAYER_ENTITY)
        break
    }
  }

  keyUpHandler(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 0 })
        break
      case 'ArrowUp':
      case 'ArrowDown':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { y: 0 })
        break
    }
  }
  //#endregion

  //#region Handlers
  handleProjectileCreation(projectileId: string) {
    const projectilePosition = this.world.getComponent(projectileId, 'position')
    const projectileDimensions = this.world.getComponent(projectileId, 'dimensions')

    const $projectileEl = document.createElement('div')
    $projectileEl.id = projectileId
    $projectileEl.className = 'projectile'
    $projectileEl.style.transform = `translate3d(${projectilePosition.x}px, ${projectilePosition.y}px, 0)`
    $projectileEl.style.width = `${projectileDimensions.width}px`
    $projectileEl.style.height = `${projectileDimensions.height}px`
  
    this.$appEl.appendChild($projectileEl)
    this.$projectilesEl.push($projectileEl)
  }

  handleWallCreation(wallId: string) {
    const wallPosition = this.world.getComponent(wallId, 'position')
    const wallDimensions = this.world.getComponent(wallId, 'dimensions')

    const $wallEl = document.createElement('div')
    $wallEl.id = wallId
    $wallEl.className = 'wall'
    $wallEl.style.transform = `translate3d(${wallPosition.x}px, ${wallPosition.y}px, 0)`
    $wallEl.style.width = `${wallDimensions.width}px`
    $wallEl.style.height = `${wallDimensions.height}px`

    this.$appEl.appendChild($wallEl)
    this.$wallsEl.push($wallEl)
  }

  handleEnemyCreation(enemyId: string) {
    const enemyPosition = this.world.getComponent(enemyId, 'position')
    const enemyDimensions = this.world.getComponent(enemyId, 'dimensions')

    const $enemyEl = document.createElement('div')
    $enemyEl.id = enemyId
    $enemyEl.className = 'enemy'
    $enemyEl.style.transform = `translate3d(${enemyPosition.x}px, ${enemyPosition.y}px, 0)`
    $enemyEl.style.width = `${enemyDimensions.width}px`
    $enemyEl.style.height = `${enemyDimensions.height}px`

    this.$appEl.appendChild($enemyEl)
    this.$enemiesEl.push($enemyEl)
  }

  handleEnemyShooting() {
    this.world.getEntitiesByTag('enemy').forEach(enemy => {
      const shooting = this.world.getComponent(enemy.id, 'shooting')

      if (!shooting?.requested) return

      this.initProjectileEntity(enemy.id)

      shooting.requested = false
    })
  }

  handleExpiredProjectiles() {
    this.$projectilesEl = this.$projectilesEl.filter($projectileEl => {
      if (!this.world.getComponent($projectileEl.id, 'expired')) return true

      $projectileEl.remove()
      this.world.removeEntity($projectileEl.id)

      return false
    })
  }
  //#endregion

  //#region Observe Events
  observeEnemyDeathHandler(event: EmitterEvents['enemy.death']) {
    console.log('enemy death', event)

    this.$enemiesEl.find($enemyEl => $enemyEl.id === event.enemyId)?.remove()
    this.$enemiesEl = this.$enemiesEl.filter($enemyEl => $enemyEl.id !== event.enemyId)
  }

  observeProjectileHitHandler(event: EmitterEvents['projectile.hit']) {
    console.log('projectile hit', event)

    this.$projectilesEl.find($projectileEl => $projectileEl.id === event.projectileId)?.remove()
    this.$projectilesEl = this.$projectilesEl.filter($projectileEl => $projectileEl.id !== event.projectileId)
  }

  observePlayerDeathHandler(event: EmitterEvents['player.death']) {
    this.$playerEl.remove()
    this.$playerEl = null
  }

  observePowerupHandler(callback: (powerupId: string) => void) {
    
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
      if (this.$playerEl && playerPosition) {
        this.$playerEl.style.transform = `translate3d(${playerPosition.x}px, ${playerPosition.y}px, 0)`
      }

      // Update Enemies
      this.$enemiesEl.forEach(enemyEl => {
        const enemyPosition = this.world.getComponent(enemyEl.id, 'position')
        enemyEl.style.transform = `translate3d(${enemyPosition.x}px, ${enemyPosition.y}px, 0)`
      })

      // Update Projectiles
      this.$projectilesEl.forEach(projectileEl => {
        const projectilePosition = this.world.getComponent(projectileEl.id, 'position')
        projectileEl.style.transform = `translate3d(${projectilePosition.x}px, ${projectilePosition.y}px, 0)`
      })

      this.handleEnemyShooting()
      this.handleExpiredProjectiles()
    }
  }
}