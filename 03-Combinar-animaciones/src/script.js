import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null
let actionIdle = null
let actionRun = null
const keysPressed = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
}

gltfLoader.load(
    '/models/Fox/glTF/Fox.gltf',
    (gltf) =>
    {
        gltf.scene.scale.set(0.025, 0.025, 0.025)
        scene.add(gltf.scene)

        // Animation
        mixer = new THREE.AnimationMixer(gltf.scene)
        
        // Create actions for animation 0 (idle) and animation 2 (run)
        actionIdle = mixer.clipAction(gltf.animations[0])
        actionRun = mixer.clipAction(gltf.animations[1])
        
        actionIdle.setEffectiveWeight(1)
        actionIdle.play()
        actionRun.play()
    }
)

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#444444',
        metalness: 0,
        roughness: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(- 5, 5, 0)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(2, 2, 2)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Keyboard controls
 */

const playerMovement = {
    speed: 0.1,
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
}

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w':
            playerMovement.forward = true
            actionRun.timeScale = 1;
            break
        case 's':
            playerMovement.backward = true
            actionRun.timeScale = -1;
            break
        case 'a':
            playerMovement.left = true
            break
        case 'd':
            playerMovement.right = true
            break
        case ' ':
            playerMovement.jump = true
            break
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w':
            playerMovement.forward = false
            break
        case 's':
            playerMovement.backward = false
            break
        case 'a':
            playerMovement.left = false
            break
        case 'd':
            playerMovement.right = false
            break
        case ' ':
            playerMovement.jump = false
            break
    }
});


/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0
const transitionSpeed = 5 // Speed of interpolation (higher = faster transition)

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Model animation
    if(mixer && actionIdle && actionRun)
    {
        mixer.update(deltaTime)
        
        // Check if any arrow key is pressed
        const anyArrowKeyPressed = playerMovement.forward || playerMovement.backward || 
                                   playerMovement.left || playerMovement.right
        
        // Smoothly interpolate between idle (0) and run (2) animations
        const targetIdleWeight = anyArrowKeyPressed ? 0 : 1
        const targetRunWeight = anyArrowKeyPressed ? 1 : 0
        
        // Apply new weights
        actionIdle.setEffectiveWeight(targetIdleWeight)
        actionRun.setEffectiveWeight(targetRunWeight)
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()