import { useRef, useEffect } from "react";
import { gql, useSubscription } from "@apollo/client";
import * as THREEJS from "three";
import * as THREE_ADDONS from "three-addons";
const THREE = { ...THREEJS, ...THREE_ADDONS };

import {
  setupGLTFLoader,
  setupDRACOLoader,
  setupRGBELoader,
} from "../lib/three/loaders";

const framesPerSecond = 28;
const delayBWRender = 1000 / framesPerSecond;

let lastupdated = new Date();
let rotation = { x: 0.0, y: 0.0, z: 0.0 };

export function start() {
  let camera, scene, renderer;
  // let stats;

  let grid;
  let controls;

  let carModel;

  const wheels = [];

  function init() {
    const container = document.getElementById("container");

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(render);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    container.appendChild(renderer.domElement);

    window?.addEventListener("resize", onWindowResize);

    // stats = new Stats();
    // container.appendChild( stats.dom );

    //

    camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(4.25, 1.4, -4.5);

    controls = new THREE.OrbitControls(camera, container);
    controls.enableDamping = true;
    controls.maxDistance = 9;
    controls.target.set(0, 0.5, 0);
    controls.update();

    setupRGBELoader(THREE);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);
    scene.environment = new THREE.RGBELoader().load(
      "https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr"
    );
    scene.environment.mapping = THREE.EquirectangularReflectionMapping;
    scene.fog = new THREE.Fog(0x333333, 10, 15);

    grid = new THREE.GridHelper(20, 40, 0xffffff, 0xffffff);
    grid.material.opacity = 0.2;
    grid.material.depthWrite = false;
    grid.material.transparent = true;
    scene.add(grid);

    // materials

    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff0000,
      metalness: 1.0,
      roughness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      sheen: 0.5,
    });

    const detailsMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.5,
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.25,
      roughness: 0,
      transmission: 1.0,
    });

    const bodyColorInput = document.getElementById("body-color");
    bodyColorInput?.addEventListener("input", function () {
      bodyMaterial.color.set(this.value);
    });

    const detailsColorInput = document.getElementById("details-color");
    detailsColorInput?.addEventListener("input", function () {
      detailsMaterial.color.set(this.value);
    });

    const glassColorInput = document.getElementById("glass-color");
    glassColorInput?.addEventListener("input", function () {
      glassMaterial.color.set(this.value);
    });

    // Car

    const shadow = new THREE.TextureLoader().load(
      "https://threejs.org/examples/models/gltf/ferrari_ao.png"
    );

    setupDRACOLoader(THREE);
    setupGLTFLoader(THREE);

    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath("js/libs/draco/gltf/");

    const loader = new THREE.GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      "https://threejs.org/examples/models/gltf/ferrari.glb",
      function (gltf) {
        carModel = gltf.scene.children[0];

        carModel.getObjectByName("body").material = bodyMaterial;

        carModel.getObjectByName("rim_fl").material = detailsMaterial;
        carModel.getObjectByName("rim_fr").material = detailsMaterial;
        carModel.getObjectByName("rim_rr").material = detailsMaterial;
        carModel.getObjectByName("rim_rl").material = detailsMaterial;
        carModel.getObjectByName("trim").material = detailsMaterial;

        carModel.getObjectByName("glass").material = glassMaterial;

        wheels.push(
          carModel.getObjectByName("wheel_fl"),
          carModel.getObjectByName("wheel_fr"),
          carModel.getObjectByName("wheel_rl"),
          carModel.getObjectByName("wheel_rr")
        );

        // shadow
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
          new THREE.MeshBasicMaterial({
            map: shadow,
            blending: THREE.MultiplyBlending,
            toneMapped: false,
            transparent: true,
          })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.renderOrder = 2;
        carModel.add(mesh);

        scene.add(carModel);
      }
    );
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function render() {
    controls.update();

    const time = -performance.now() / 1000;

    // for (let i = 0; i < wheels.length; i++) {
    //   wheels[i].rotation.x = time * Math.PI * 2;
    // }
    //console.log(rotation);
    if (carModel && carModel.rotation) {
      if (
        rotation &&
        new Date() - lastupdated > delayBWRender &&
        (rotation.x !== lastRotation?.x ||
          rotation.y !== lastRotation?.y ||
          rotation.z !== lastRotation?.z)
      ) {
        carModel.rotation.x = rotation?.x;
        carModel.rotation.z = rotation?.y;
        carModel.rotation.y = rotation?.z;
        lastupdated = new Date();
        // grid.position.z = -time % 1;
        renderer.render(scene, camera);
      }
      // carModel.rotation.x += 0.01
      // carModel.rotation.y += 0.01
      // carModel.rotation.z += 0.01
    }


    // stats.update();
  }

  init();
}
let started = false;
const SUBSCRIPTION = gql`
  subscription GetDeviceData($timestamp: timestamptz) {
    device_data_stream(
      batch_size: 1
      cursor: { initial_value: { timestamp: $timestamp }, ordering: ASC }
      where: { device_id: { _eq: "android" } }
    ) {
      data
      device_id
      id
      timestamp
    }
  }
`;
let lastRotation = {
  x: 0,
  y: 0,
  z: 0,
};
export const useDigitalTwin = () => {
  useEffect(() => {
    if (!started) {
      start(rotation);
      started = true;
    }
    console.log(">>");
    rotation.currrent = { x: 0.0, y: 0.0, z: 0.0 };

    // un-comment this to test the renderer
    // setInterval(() => {
    //   // rotation.currrent.x += 0.01;
    //   // rotation.currrent.y += 0.01;
    //   // rotation.currrent.z += 0.01;
    // }, delayBWRender);
  }, []);

  const { data, loading } = useSubscription(SUBSCRIPTION, {
    variables: { timestamp: new Date().toISOString() },
  });

  useEffect(() => {
    if (!data?.device_data_stream?.[0]?.data) return;

    const rtn = parsePayload(data?.device_data_stream?.[0]?.data);
    if (rtn) {
      console.log(rtn.x !== lastRotation?.x);
      if (
        rtn.x !== lastRotation?.x ||
        rtn.y !== lastRotation?.y ||
        rtn.z !== lastRotation?.z
      ) {
        lastRotation = { ...rotation };
        rotation = rtn;
        console.log(rtn);
      }
    }
  }, [data]);
};

const parsePayload = (str) => {
  try {
    const string = str.substring(9, str.length - 1).split(",");
    const rot = {};
    string.forEach((i) => {
      const vals = i.split("=");
      rot[vals[0].trim(" ")] = Number(vals[1]);
    });
    return rot;
  } catch (e) {
    return;
  }
};
