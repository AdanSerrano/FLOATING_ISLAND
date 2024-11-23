import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Escena, cámara y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Habilitar sombras
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Fondo blanco
scene.background = new THREE.Color(0xffffff);

// Luz
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
scene.add(light);

// Suelo para recibir sombras
const planeGeometry = new THREE.PlaneGeometry(500, 500);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 }); // Sombra tenue
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -5.5;
plane.receiveShadow = true;
scene.add(plane);

// Cámara
camera.position.z = 25;

// Cargar modelo GLTF
const loader = new GLTFLoader();
let island;

loader.load('/assets/island_model.glb', (gltf) => {
    island = gltf.scene;

    // Habilitar sombras para la isla
    island.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });

    island.position.y = -5;
    scene.add(island);
});

// Variables para control de rotación
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Control de zoom
let zoomLevel = 10; // Nivel inicial de zoom
const minZoom = 5; // Nivel mínimo
const maxZoom = 30; // Nivel máximo

// Animación flotante
const clock = new THREE.Clock();

const animate = () => {
    requestAnimationFrame(animate);

    // Movimiento flotante
    if (island) {
        const time = clock.getElapsedTime();
        island.position.y = Math.sin(time) * 0.5;
    }

    renderer.render(scene, camera);
};
animate();

// Eventos del mouse para rotar la isla
document.addEventListener('mousedown', () => {
    isDragging = true;
});

document.addEventListener('mousemove', (event) => {
    if (isDragging && island) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y,
        };

        island.rotation.y += deltaMove.x * 0.01; // Rotación horizontal
        island.rotation.x += deltaMove.y * 0.01; // Rotación vertical (opcional)

        previousMousePosition = {
            x: event.clientX,
            y: event.clientY,
        };
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// Evento para zoom con el trackpad o scroll del mouse
document.addEventListener('wheel', (event) => {
    if (event.deltaY < 0) {
        // Zoom in
        zoomLevel = Math.max(minZoom, zoomLevel - 1);
    } else {
        // Zoom out
        zoomLevel = Math.min(maxZoom, zoomLevel + 1);
    }

    camera.position.z = zoomLevel; // Ajusta la posición de la cámara
});

// Ajustar tamaño al redimensionar ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
