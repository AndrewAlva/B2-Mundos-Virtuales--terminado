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


///// Three.JS objects
const sphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius),
    new THREE.MeshNormalMaterial()
)
scene.add(sphereMesh);

const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
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
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Physics
    world.fixedStep();

    sphereMesh.position.copy(sphereBody.position)
    sphereMesh.quaternion.copy(sphereBody.quaternion)


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()