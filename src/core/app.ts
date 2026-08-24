import { World } from "../libs/ecs/world";

// Systems
import { 
  MovementSystem, 
  ProjectileSystem,
  CollisionDetectionSystem
} from './systems';


export const PLAYER_ENTITY = 'player_1'

//*
// Todo: implement components as struct data types, instead of playing with strings with objects
// Todo: implement the entity handlers as a separate class, so we can easily add more entities to the world
//  */

export class App {

  declare isReady: boolean
  declare isRunning: boolean

  declare $appEl: HTMLElement
  declare $playerEl: HTMLElement
  declare $projectilesEl: HTMLElement[]
  declare $wallsEl: HTMLElement[]
  declare $enemiesEl: HTMLElement[]
  declare $powerupsEl: HTMLElement[]
  
  world: World

  constructor() {
    this.$appEl = document.getElementById('app') as HTMLElement
    this.$playerEl = document.getElementById('player-debug') as HTMLElement
    
    this.$projectilesEl = []
    this.$wallsEl = []
    this.$enemiesEl = []
    this.$powerupsEl = []

    this.init();

    console.log(this)
  }

  init() {

    this.initWorld()
    
    // Init Entities
    this.initPlayerEntity()

    this.initWallEntity({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, { width: 100, height: 100, depth: 0 })
    
    // Init Keyboard Handlers
    this.initKeyboardHandlers()
    
    this.isReady = true
  }

  initWorld() {
    this.world = new World()

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
    this.world.addComponent(PLAYER_ENTITY, 'health', { value: 100 })
    this.world.addComponent(PLAYER_ENTITY, 'dimensions', { width: 25, height: 25, depth: 0 })
    this.world.addComponent(PLAYER_ENTITY, 'bbox', { width: 25, height: 25, depth: 0 })
  }

  initEnemyEntity() {
    const enemyId = this.world.addEntity('enemy', true, ['enemy', 'movable', 'collidable'])

    this.world.addComponent(enemyId, 'position', { x: 0, y: 0 })
    this.world.addComponent(enemyId, 'velocity', { x: 0, y: 0 })
    this.world.addComponent(enemyId, 'direction', { x: 0, y: 0 })
    this.world.addComponent(enemyId, 'health', { value: 100 })
    this.world.addComponent(enemyId, 'dimensions', { width: 10, height: 10, depth: 0 })
    this.world.addComponent(enemyId, 'bbox', { width: 10, height: 10, depth: 0 })
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
    this.world.addComponent(projectileId, 'damage', { value: 10 })
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
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: -3, y: 0 })
        this.world.addComponent(PLAYER_ENTITY, 'direction', { x: -3, y: 0 })
        break
      case 'ArrowRight':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 3, y: 0 })
        this.world.addComponent(PLAYER_ENTITY, 'direction', { x: 3, y: 0 })
        break
      case 'ArrowUp':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 0, y: -3 })
        this.world.addComponent(PLAYER_ENTITY, 'direction', { x: 0, y: -3 })
        break
      case 'ArrowDown':
        this.world.addComponent(PLAYER_ENTITY, 'velocity', { x: 0, y: 3 })
        this.world.addComponent(PLAYER_ENTITY, 'direction', { x: 0, y: 3 })
        break
      case 'Space':
        this.initProjectileEntity(PLAYER_ENTITY)
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

      // Update Projectiles
      this.$projectilesEl.forEach(projectileEl => {
        const projectilePosition = this.world.getComponent(projectileEl.id, 'position')
        projectileEl.style.transform = `translate3d(${projectilePosition.x}px, ${projectilePosition.y}px, 0)`
      })
    }
  }
}