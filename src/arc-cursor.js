import { ArcCursorActions } from './arc-cursor-actions.js'

/**
 * Cursor A-Frame component, that moves with the mouse.
 *
 * @author Barthy Bonhomme <post@barthy.koeln>
 * @licence MIT
 */
export const ArcCursor = {

  schema: {

    /**
     * Used for gaze click. Icons and titles start off with this color and gradually morph to the interactionColor.
     */
    startColor: {
      type: 'vec3',
      default: { x: 0, y: 1, z: 1 }
    },

    /**
     * Used for gaze click. Icons and titles morph to this color before the action is triggered.
     * Default color for non gaze-only interaction.
     */
    interactionColor: {
      type: 'vec3',
      default: { x: 0, y: 0, z: 1 }
    },

    /**
     * Whether the component should be rendered on top of everything else or be able to go through other elements.
     */
    onTop: {
      type: 'boolean',
      default: true
    }
  },

  /**
   * Initialize the necessary objects and functions
   */
  init () {
    /**
     * Whether the current device uses mainly touch input or not
     * @type {boolean}
     */
    this.isTouch = window.matchMedia('(pointer: coarse)').matches

    /**
     * Whether gaze-only interaction is enabled
     * @type {boolean}
     */
    this.gazeClick = this.isTouch

    /**
     * Object holding all active animations
     * @type {Object}
     */
    this.animations = {}

    /**
     * Parsed start color
     * @type {Color}
     */
    this.startColor = new THREE.Color()

    /**
     * Parsed interaction color
     * @type {Color}
     */
    this.interactionColor = new THREE.Color()

    this.bindFunctions()
    this.addEventListeners()
  },

  /**
   * Parse colors
   */
  update () {
    this.startColor.set(
      this.data.startColor.x,
      this.data.startColor.y,
      this.data.startColor.z
    )

    this.interactionColor.set(
      this.data.interactionColor.x,
      this.data.interactionColor.y,
      this.data.interactionColor.z
    )

    this.addGeometry()
  },

  /**
   * Add event listeners
   */
  addEventListeners () {
    this.el.sceneEl.addEventListener('arc-remote-connected', this.arcsConnected)
    this.el.sceneEl.addEventListener('arc-remote-disconnected', this.arcsDisconnected)
    this.el.sceneEl.addEventListener('arc-cursor-activate', this.activateActions)
    this.el.sceneEl.addEventListener('arc-cursor-deactivate', this.deactivateActions)

    window.addEventListener('mousedown', this.clickHandler)
  },

  /**
   * Bind functions to this component
   */
  bindFunctions () {
    this.activateActions = this.activateActions.bind(this)
    this.deactivateActions = this.deactivateActions.bind(this)
    this.arcsConnected = this.arcsConnected.bind(this)
    this.clickHandler = this.clickHandler.bind(this)
  },

  /**
   * Create cursor geometry and icon meshes
   */
  addGeometry () {
    if (this.mesh) {
      this.el.object3D.remove(this.mesh)

      for (const mesh of Object.values(this.iconMeshes)) {
        this.el.object3D.remove(mesh)
      }
    }

    const depthTestAndWrite = !this.data.onTop
    const geometry = new THREE.RingBufferGeometry(0.00015, 0.015, 32)
    const material = new THREE.MeshBasicMaterial({
      color: this.startColor.clone(),
      side: THREE.FrontSide,
      transparent: true,
      opacity: 0.75,
      depthTest: depthTestAndWrite,
      depthWrite: depthTestAndWrite
    })

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.set(0, 0, -0.35)

    this.el.object3D.add(this.mesh)

    this.iconMeshes = {}
    const spriteGeometry = new THREE.PlaneBufferGeometry(0.055, 0.055, 1)
    const spriteMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      color: this.startColor.clone(),
      opacity: 0,
      depthTest: depthTestAndWrite,
      depthWrite: depthTestAndWrite
    })

    this.iconMeshes[ArcCursorActions.PRIMARY] = new THREE.Mesh(spriteGeometry, spriteMaterial, { renderOrder: 999 })
    this.iconMeshes[ArcCursorActions.SECONDARY] = new THREE.Mesh(spriteGeometry.clone(), spriteMaterial.clone())

    this.iconMeshes[ArcCursorActions.PRIMARY].position.set(-0.055, -0.0275, -0.35)
    this.iconMeshes[ArcCursorActions.SECONDARY].position.set(0.055, -0.0275, -0.35)

    this.iconMeshes[ArcCursorActions.PRIMARY].visible = false
    this.iconMeshes[ArcCursorActions.SECONDARY].visible = false

    if (this.data.onTop) {
      this.mesh.renderOrder = 999
      this.iconMeshes[ArcCursorActions.PRIMARY].renderOrder = 999
      this.iconMeshes[ArcCursorActions.SECONDARY].renderOrder = 999
    }

    this.el.object3D.add(this.iconMeshes[ArcCursorActions.PRIMARY])
    this.el.object3D.add(this.iconMeshes[ArcCursorActions.SECONDARY])
  },

  /**
   * Activate remote mouse click events, deactive gaze click events
   */
  arcsConnected () {
    this.el.sceneEl.emit('arc-remote-add-listener', {
      events: ['mousedown']
    })

    this.gazeClick = false
  },

  /**
   * Activate gaze mouse click events
   */
  arcsDisconnected () {
    this.gazeClick = this.isTouch
  },

  /**
   * Activate certain actions for a specified key
   *
   * @param {CustomEvent} event
   */
  activateActions (event) {
    const { actions } = event.detail

    for (const action of actions) {
      this.el.emit(`arc-cursor-${action.name}-title`, action.title)

      this.setIcon(action.name, action.icon ? action.icon : null)

      const animationName = `${action.name}-delay`
      const useDelay = action.delay && this.gazeClick
      this.animations[animationName] = AFRAME.ANIME({
        targets: this.iconMeshes[action.name].material.color,
        r: useDelay ? this.interactionColor.r : this.startColor.r,
        g: useDelay ? this.interactionColor.g : this.startColor.g,
        b: useDelay ? this.interactionColor.b : this.startColor.b,
        duration: useDelay ? action.delay : 0,
        easing: 'linear',
        autoplay: false,
        complete: () => {
          this.resetDelayAnimation(action.name, animationName)

          if (this.gazeClick && action.click) {
            this.triggerCLick(action.name)
          }

          if (action.callback && typeof action.callback === 'function') {
            action.callback()
          }
        }
      })
    }
  },

  resetDelayAnimation (name, animationName) {
    if (this.animations[animationName]) {
      this.animations[animationName].pause()
      this.animations[animationName] = AFRAME.ANIME({
        targets: this.iconMeshes[name].material.color,
        r: this.startColor.r,
        g: this.startColor.g,
        b: this.startColor.b,
        duration: 200,
        easing: 'easeOutCubic',
        autoplay: false,
        complete: () => {
          this.animations[animationName] = null
        }
      })
    }
  },

  /**
   * Deactivate certain actions for a specified key
   *
   * @param {CustomEvent} event
   */
  deactivateActions (event) {
    const { actions } = event.detail

    for (const action of actions) {
      this.el.emit(`arc-cursor-${action}-title`, null)

      this.setIcon(action, null)
      this.resetDelayAnimation(action, `${action}-delay`)
    }
  },

  /**
   * Handle click events and trigger the appropriate action
   *
   * @param {MouseEvent} event
   */
  clickHandler (event) {
    let actionType = [][event.button]
    switch (event.button) {
      case 0:
        actionType = ArcCursorActions.PRIMARY
        break
      case 2:
        actionType = ArcCursorActions.SECONDARY
        break
    }

    this.triggerCLick(actionType)
  },

  /**
   * Trigger an action event and animate the cursor
   * @param {string} actionType
   */
  triggerCLick (actionType) {
    this.el.sceneEl.emit(`arc-cursor-${actionType}-click`)

    if (!this.animations.cursor) {
      this.animations.cursor = AFRAME.ANIME({
        targets: this.mesh.material.color,
        r: this.interactionColor.r,
        g: this.interactionColor.g,
        b: this.interactionColor.b,
        duration: 200,
        easing: 'easeOutCubic',
        direction: 'alternate',
        autoplay: false,
        complete: () => {
          this.animations.cursor = null
        }
      })
    }
  },

  /**
   * Run animations
   * @param {Number} time Scene Uptime in seconds
   */
  tick (time) {
    for (const animation of Object.values(this.animations)) {
      if (animation === null) {
        continue
      }

      animation.tick(time)
    }
  },

  /**
   * Set the icon texture and animate opacity
   * @param {String} action
   * @param {Texture} icon
   */
  setIcon (action, icon) {
    if (icon === null) {
      if (this.animations[action]) {
        this.animations[action].pause()
      }

      this.animations[action] = AFRAME.ANIME({
        targets: this.iconMeshes[action].material,
        opacity: 0,
        duration: 200,
        easing: 'easeOutCubic',
        autoplay: false,
        complete: () => {
          this.iconMeshes[action].material.map = null
          this.iconMeshes[action].material.needsUpdate = true
          this.iconMeshes[action].visible = false
        }
      })

      return
    }

    this.iconMeshes[action].visible = true
    this.iconMeshes[action].material.map = icon
    this.iconMeshes[action].material.needsUpdate = true

    if (this.animations[action]) {
      this.animations[action].pause()
    }

    this.animations[action] = AFRAME.ANIME({
      targets: this.iconMeshes[action].material,
      autoplay: false,
      opacity: 0.75,
      duration: 200,
      easing: 'easeOutCubic'
    })
  }
}
