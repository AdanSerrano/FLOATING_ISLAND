// Importación de módulos necesarios
import * as THREE from 'three';

import { AnimationMixer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Configuración inicial de la escena
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Añadido antialias para mejor calidad

// Configuración del renderizador
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio); // Mejora la nitidez en pantallas de alta resolución
document.body.appendChild(renderer.domElement);

// Configuración del fondo y ambiente
scene.background = new THREE.Color(0xffffff);
const ambientLight = new THREE.AmbientLight(0x404040, 1); // Luz ambiente suave
scene.add(ambientLight);

// Luz principal
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
light.castShadow = true;
light.shadow.mapSize.width = 2048; // Mayor resolución de sombras
light.shadow.mapSize.height = 2048;
light.shadow.camera.far = 50;
scene.add(light);

// Suelo para sombras
const planeGeometry = new THREE.PlaneGeometry(500, 500);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -5.5;
plane.receiveShadow = true;
scene.add(plane);

// Configuración inicial de la cámara
camera.position.set(0, 20, 75);
camera.lookAt(0, 0, 0);

// Controles orbitales para mejor navegación
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Añade suavidad al movimiento
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.5;
controls.minDistance = 20;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI / 2; // Limita la rotación vertical

// Grupo principal para la isla y el pájaro
const islandGroup = new THREE.Object3D();
scene.add(islandGroup);

// Variables globales
let island, falcon, mixer;
const loader = new GLTFLoader();

// Carga de la isla
loader.load('/assets/ISLA_FLOTANTE.glb',
    (gltf) => {
        island = gltf.scene;
        island.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                // Mejora de materiales
                if (node.material) {
                    node.material.roughness = 0.8;
                    node.material.metalness = 0.2;
                }
            }
        });
        island.position.y = -5;
        islandGroup.add(island);
    },
    (progress) => {
        console.log('Cargando isla:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
        console.error('Error cargando la isla:', error);
    }
);

// Carga del pájaro
loader.load('/assets/peregrinefalcon.glb',
    (gltf) => {
        falcon = gltf.scene;
        falcon.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                // Mejora de materiales del pájaro
                if (node.material) {
                    node.material.roughness = 0.6;
                    node.material.metalness = 0.3;
                }
            }
        });

        falcon.position.set(15, 5, 0);
        falcon.scale.set(0.5, 0.5, 0.5);
        islandGroup.add(falcon);

        // Sistema de animación
        mixer = new AnimationMixer(falcon);
        if (gltf.animations.length > 0) {
            const flyingAnimation = mixer.clipAction(gltf.animations[0]);
            flyingAnimation.play();
            flyingAnimation.timeScale = 0.2; // Velocidad de animación ajustada
        }
    },
    (progress) => {
        console.log('Cargando pájaro:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
        console.error('Error cargando el pájaro:', error);
    }
);

// Animación principal
const clock = new THREE.Clock();

const animate = () => {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Actualización de controles
    controls.update();

    // Animación de flotación de la isla
    if (island) {
        const time = clock.getElapsedTime();
        island.position.y = -5 + Math.sin(time * 0.5) * 0.5; // Movimiento más suave
    }

    // Animación del pájaro
    if (falcon) {
        const time = clock.getElapsedTime();
        const radius = 15;
        // Movimiento más complejo del pájaro
        falcon.position.x = Math.cos(time * 0.5) * radius;
        falcon.position.z = Math.sin(time * 0.5) * radius;
        falcon.position.y = 5 + Math.sin(time) * 1;

        // Rotación suave del pájaro
        const targetRotation = Math.atan2(
            -Math.cos(time * 0.5),
            -Math.sin(time * 0.5)
        );
        falcon.rotation.y = targetRotation + Math.PI / 2;

        // Inclinación natural en las curvas
        falcon.rotation.z = Math.sin(time * 0.5) * 0.1;
    }

    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
};

// Iniciar animación
animate();

// Manejo de redimensionamiento de ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Sistema de carga con indicador visual
const loadingManager = new THREE.LoadingManager();
const loadingElement = document.createElement('div');
loadingElement.style.position = 'fixed';
loadingElement.style.top = '50%';
loadingElement.style.left = '50%';
loadingElement.style.transform = 'translate(-50%, -50%)';
loadingElement.style.background = 'rgba(0, 0, 0, 0.8)';
loadingElement.style.color = 'white';
loadingElement.style.padding = '20px';
loadingElement.style.borderRadius = '10px';
loadingElement.style.display = 'none';
document.body.appendChild(loadingElement);

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal * 100).toFixed(0);
    loadingElement.textContent = `Cargando... ${progress}%`;
    loadingElement.style.display = 'block';
};

loadingManager.onLoad = () => {
    loadingElement.style.display = 'none';
};