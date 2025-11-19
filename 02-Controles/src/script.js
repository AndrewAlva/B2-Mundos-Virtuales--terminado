import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as CANNON from 'cannon-es'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene();

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
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 9
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


/**
 * ////////////////////////////////////////////////////////////
 * Physics
 */
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0) // m/s^2 (Earth's gravity)
});

// Dynamic Body
const radius = 1 // m
const sphereBody = new CANNON.Body({
    mass: 5, // kg
    shape: new CANNON.Sphere(radius),
});
sphereBody.position.set(0, 4, 0) // m
world.addBody(sphereBody)


// Static Body
const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
groundBody.position.set(0, -2, 0) // m
world.addBody(groundBody)

const obstacleSize = 1
const obstacleBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(obstacleSize, obstacleSize, obstacleSize)),
});
obstacleBody.position.set(1.5, -1, -0.5) // m
world.addBody(obstacleBody)


////////////////////////////////////////////////////////////
///// Three.JS objects
const sphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius),
    new THREE.MeshNormalMaterial()
)
scene.add(sphereMesh);

const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({ color: 0x333333 })
)
groundMesh.rotation.x = -Math.PI / 2
groundMesh.position.y = -2
scene.add(groundMesh)

const obstacleMesh = new THREE.Mesh(
    new THREE.BoxGeometry(obstacleSize * 2, obstacleSize * 2, obstacleSize * 2),
    new THREE.MeshBasicMaterial({ color: 0xdddddd })
)
obstacleMesh.position.copy(obstacleBody.position)
scene.add(obstacleMesh)


/**
 * ////////////////////////////////////////////////////////////
 * Player
 */

// Player physics
const radiusTop = 0.5
const radiusBottom = 0.5
const height = 2
const numSegments = 12
const cylinderShape = new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments)
const playerBody = new CANNON.Body({ mass: 999, shape: cylinderShape })
playerBody.position.set(-4, -1, 0) // m
world.addBody(playerBody)

// Player mesh
const playerMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, numSegments),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
)
playerMesh.position.copy(playerBody.position)
scene.add(playerMesh)


/**
 * ////////////////////////////////////////////////////////////
 * Player Controls
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
            break
        case 's':
            playerMovement.backward = true
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

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Physics
    world.fixedStep();

    // Player movement
    if (playerMovement.forward) {
        playerBody.position.z -= playerMovement.speed
    }
    if (playerMovement.backward) {
        playerBody.position.z += playerMovement.speed
    }
    if (playerMovement.left) {
        playerBody.position.x -= playerMovement.speed
    }
    if (playerMovement.right) {
        playerBody.position.x += playerMovement.speed
    }
    if (playerMovement.jump) {
        playerBody.position.y += playerMovement.speed
    }

    sphereMesh.position.copy(sphereBody.position)
    sphereMesh.quaternion.copy(sphereBody.quaternion)

    // Player
    playerMesh.position.copy(playerBody.position)
    playerMesh.quaternion.copy(playerBody.quaternion)


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()