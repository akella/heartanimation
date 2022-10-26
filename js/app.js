import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import heartfragment from "./shader/heart.glsl";
import vertex from "./shader/vertex.glsl";
import vertexParticles from "./shader/vertexParticles.glsl";
import fragmentParticles from "./shader/fragmentParticles.glsl";
import GUI from "lil-gui";
import gsap from "gsap";
const createInputEvents = require("simple-input-events");
import {Howl, Howler} from 'howler';

// ASSETS
import body from "../models/body.glb";
import heartRealSick from "../models/heart-sick.glb";
import t1 from "../models/t/heart_L_veins2.jpg";
import t2 from "../models/t/heart_R_veins2.jpg";
import t3 from "../models/t/heart_Body_veins3.png";
import t4 from "../models/t/heart_Aorta_veins2.jpg";
import mask from "../models/t/heart_Body_mask.jpg";


// this needs replacement with variables!!!!
// ===========================
import sound1 from '../mp3/scene_1-MP3.mp3'
import sound2 from '../mp3/Scene_2_-_With_a_diseased_heart_(Heart_Beats_Fast).mp3'
import sound3 from '../mp3/Scene_3_-_The_medicine_enters_the_heart_(magic_wind_spell_2).mp3'
import sound4 from '../mp3/Scene_4_-_Healthy_heart_with_the_normal_heartbeat_(Heart_Beat_04).mp3'


// ====
// _       _       _       _       _       _       _       _
// _-(_)-  _-(_)-  _-(_)-  _-(_)-  _-(_)-  _-(_)-  _-(_)-  _-(_)-
// `(___)  `(___)  `(___)  `(___)  `(___)  `(___)  `(___)  `(___)
// jgs // \\   // \\   // \\   // \\   // \\   // \\   // \\   // \\
// REPLACE WITH THIS FOR WEBPACK

// const body = "../models/body.glb";
// const heartRealSick = "../models/heart-sick.glb";
// const t1 = "../models/t/heart_L_veins2.jpg";
// const t2 = "../models/t/heart_R_veins2.jpg";
// const t3 = "../models/t/heart_Body_veins3.png";
// const t4 = "../models/t/heart_Aorta_veins2.jpg";
// const mask = "../models/t/heart_Body_mask.jpg";

const DEBUG = false;

function clamp(a, min, max) {
  return Math.max(min, Math.min(max, a));
}
function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}
export default class Sketch {
  constructor(options) {
    this.event = createInputEvents(
      document.querySelector(".interactive-layer")
    );

    this.sound1 =  new Howl({
      src: [sound1],
      autoplay: true,
      loop: true,
      volume: 0.2
    });

    this.sound2 =  new Howl({
      src: [sound2],
      autoplay: false,
      loop: true,
      volume: 0.2
    });
    

    this.sound4 =  new Howl({
      src: [sound4],
      autoplay: false,
      loop: true,
      volume: 0.2
    });

    this.sound3 =  new Howl({
      src: [sound3],
      autoplay: false,
      loop: false,
      volume: 0.2,
      onend: ()=> {
        this.sound4.play()
      }
    });

    this.callback = options.callback || function () {};
    this.mobile = options.mobile;
    this.scene = new THREE.Scene();
    this.scene1 = new THREE.Scene();
    this.sceneParticles = new THREE.Scene();
    this.sceneHeart = new THREE.Scene();
    this.groupHeart = new THREE.Group();
    this.sceneHeart.add(this.groupHeart);
    this.clock = new THREE.Clock();
    this.container = options.dom;
    this.position = 0;
    this.progress = 0;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.materials = [];
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0x000000, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.heartbeat = 1;

    this.targetRotation = new THREE.Vector2(0, 0);
    this.targetRotationMouseDown = new THREE.Vector2(0, 0);
    this.mouseDown = new THREE.Vector2(0, 0);
    this.mouse = new THREE.Vector2(0, 0);

    this.mouseTarget = new THREE.Vector2(0, 0);

    this.dummy = new THREE.Object3D();

    this._position = new THREE.Vector3();
    this._normal = new THREE.Vector3();

    // this.scroller = new VirtualScroll();
    // this.scroller.on((event) => {
    //   // wrapper.style.transform = `translateY(${event.y}px)`
    //   // this.position = -event.y/5000
    //   this.position -= event.deltaY / 5000;

    //   this.position = clamp(this.position, 0, 1);
    // });

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      40,
      this.width / this.height,
      0.01,
      100
    );

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 2);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/"
    ); 
    // this.dracoLoader.setDecoderPath(
    //   "/draco/"
    // ); 
    this.gltf = new GLTFLoader();
    this.gltf.setDRACOLoader(this.dracoLoader);
    this.gltf.setMeshoptDecoder(MeshoptDecoder);

    this.isPlaying = true;

    let t1Promise = new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(t1, (texture) => {
        this.t1 = texture;
        resolve(texture);
      });
    });

    let t2Promise = new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(t2, (texture) => {
        this.t2 = texture;
        resolve(texture);
      });
    });

    let t3Promise = new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(t3, (texture) => {
        this.t3 = texture;
        resolve(texture);
      });
    });

    let t4Promise = new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(t4, (texture) => {
        this.t4 = texture;
        resolve(texture);
      });
    });

    let maskPromise = new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(mask, (texture) => {
        this.mask = texture;
        resolve(texture);
      });
    });

    this.addParticles();
    Promise.all([t1Promise, t2Promise, t3Promise, t4Promise, maskPromise]).then(
      () => {
        
        Promise.all([this.addObjects(), this.addHeart()]).then(() => {
          // alert("a");
          this.mouseEvents();
          
          // this.addObjects();
          // this.addHeart();

          this.resize();
          this.render();
          this.setupResize();
          this.addLights();
          this.settings();
          this.triggers();
          this.callback()
        });
      }
    );
  }

  triggers() {
    document.querySelector(".js-trigger").addEventListener("click", () => {
      this.sound2.play()
      if (this.progress < 0.5) {
        gsap.to(this, {
          progress: 1,
          duration: 2,
          ease: "power2.inOut",
          onComplete: () => {
            document
              .querySelector(".js-trigger")
              .querySelector("span").innerHTML = "Cure me";
          },
        });
      } else {
        this.settings.animateHeart();
        this.sound2.fade(0.2,0,0.3)
        this.sound3.play()
      }
    });
  }

  positionTooltip() {
    // const point = this.testmesh.position.clone();

    this.sceneHeart.updateMatrixWorld(true);
    let point = new THREE.Vector3();
    point.setFromMatrixPosition(this.testmesh.matrixWorld);
    //  this.testmesh.getWorldPosition(point);

    // point = new THREE.Vector3(0,0,0)
    point.project(this.camera);

    const translate = {
      x: point.x * this.width * 0.5 + this.width * 0.5,
      y: -point.y * this.height * 0.5 + this.height * 0.5,
    };
    document.querySelector(
      ".js-trigger"
    ).style.transform = `translate(${translate.x}px, ${translate.y}px)`;
  }

  settings() {
    let that = this;

    this.settings = {
      progress: 0,
      health: 0,
      uParticleColor: "#ff0000",
      uColor: "#ff0000",
      uSize: 1,
      uColorSick: "#ff0000",
      animateHeart: () => {
        let o = { p: 0 };
        let tl = gsap.timeline();
        tl.to(this.particleMaterial.uniforms.uProgress, {
          duration: 2,
          value: 0.2,
        });
        tl.to(this.particleMaterial.uniforms.uProgress, {
          duration: 6,
          value: 1,
          ease: "power2.inOut",
        });
        tl.to(
          this,
          {
            heartbeat: 0.5,
            duration: 2,
          },
          "-=3"
        );
        tl.to(
          o,
          {
            p: 1,
            duration: 1,
            onUpdate: () => {
              this.setHealthProgress(o.p);
            },
          },
          "-=1"
        );
        tl.to(
          this,
          {
            heartbeat: 0.5,
            duration: 1,
          },
          "-=1"
        );
      },
    };
    if (DEBUG) {
      this.gui = new GUI();
      this.gui.add(this.settings, "progress", 0, 1, 0.01).onChange((val) => {
        this.particleMaterial.uniforms.uProgress.value = val;
      });
      this.gui.add(this.settings, "uSize", 0, 2, 0.01).onChange((val) => {
        this.particleMaterial.uniforms.uSize.value = val;
      });

      this.gui.addColor(this.settings, "uParticleColor").onChange((val) => {
        this.particleMaterial.uniforms.uColor.value = new THREE.Color(val);
      });
      this.gui.add(this.settings, "health", 0, 1, 0.01).onChange((val) => {
        this.setHealthProgress(val);
      });
      this.gui.add(this.settings, "animateHeart");
      this.gui.addColor(this.settings, "uColor").onChange((val) => {
        this.materials.forEach((m) => {
          if (m.userData.shader)
            m.userData.shader.uniforms.uColor1.value = new THREE.Color(val);
        });
      });
      this.gui.addColor(this.settings, "uColorSick").onChange((val) => {
        this.materials.forEach((m) => {
          if (m.userData.shader)
            m.userData.shader.uniforms.uColorSick.value = new THREE.Color(val);
        });
      });
    }
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  setMaterialProgress(val) {
    this.materials.forEach((m) => {
      if (m.userData.shader) m.userData.shader.uniforms.uProgress.value = val;
    });
  }
  setHealthProgress(val) {
    this.materials.forEach((m) => {
      if (m.userData.shader) m.userData.shader.uniforms.uHealth.value = val;
    });
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    if (this.mobile()) {
      this.startX = 0;
      this.endX = 0;
    } else {
      this.startX = -0.2;
      this.endX = -0.08;
    }
    this.camera.updateProjectionMatrix();
  }

  mouseEvents() {
    let self = this;
    this.event.on("move", ({ position, dragging }) => {
      self.mouse.x = (position[0] / this.width) * 2 - 1;
      self.mouse.y = -(position[1] / this.height) * 2 + 1;
      // console.log(self.mouse);

      if (dragging && this.progress > 0.5) {
        self.targetRotation.y =
          self.targetRotationMouseDown.y +
          (self.mouse.y - self.mouseDown.y) * 0.1;
        self.targetRotation.x =
          self.targetRotationMouseDown.x +
          (self.mouse.x - self.mouseDown.x) * 0.1;
      }
    });

    this.event.on("down", ({ position }) => {
      self.mouseDown.x = (position[0] / this.width) * 2 - 1;
      self.mouseDown.y = -(position[1] / this.height) * 2 + 1;

      self.targetRotationMouseDown.x = self.targetRotation.x;
      self.targetRotationMouseDown.y = self.targetRotation.y;
    });
  }

  addParticles() {
    this.particleMaterial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uSize: { value: 1 },
        uColor: { value: new THREE.Color(0.046, 0.888, 0.919) },
      },
      // wireframe: true,
      transparent: true,
      vertexShader: vertexParticles,
      fragmentShader: fragmentParticles,
      // side: THREE.DoubleSide
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.geometry = new THREE.BufferGeometry();
    let number = 3000;
    this.number = number;
    let positions = new Float32Array(number * 3);
    let rotations = new Float32Array(number);
    let randomunit = new Float32Array(number * 3);
    let offsets = new Float32Array(number);
    let speeds = new Float32Array(number);
    let randoms = new Float32Array(number);

    for (let i = 0; i < number; i++) {
      let x = 1 * Math.random();
      let y = 1.5 * (Math.random() - 0.5);
      let z = 0.05 * Math.random();
      let rot = Math.random() * Math.PI * 2;

      let theta = Math.random() * Math.PI * 2;
      let r = Math.random();
      let xx = (1 + r) * Math.cos(theta);
      let yy = (1 + r) * Math.sin(theta);
      let offset = Math.random();

      positions.set([-x, y, 0], i * 3);
      rotations.set([rot], i);
      offsets.set([offset], i);
      speeds.set([Math.random()], i);
      randoms.set([Math.random()], i);
      randomunit.set([xx, yy, Math.random()], i * 3);
    }

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    this.geometry.setAttribute(
      "aDir",
      new THREE.BufferAttribute(randomunit, 3)
    );
    this.geometry.setAttribute(
      "aRotation",
      new THREE.BufferAttribute(rotations, 1)
    );
    this.geometry.setAttribute(
      "aOffset",
      new THREE.BufferAttribute(offsets, 1)
    );
    this.geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    this.geometry.setAttribute(
      "aRandom",
      new THREE.BufferAttribute(randoms, 1)
    );

    this.points = new THREE.Points(this.geometry, this.particleMaterial);
    this.sceneParticles.add(this.points);
  }

  addObjects() {
    return new Promise((resolve, reject) => {
      this.fresnel = new THREE.ShaderMaterial({
        extensions: {
          derivatives: "#extension GL_OES_standard_derivatives : enable",
        },
        uniforms: {
          time: { value: 0 },
          uFade: { value: 0 },
          uScale: { value: 1 },
          uOpacity: { value: 1 },
          uBias: { value: 0 },
          uPower: { value: 2 },
          uColor: { value: new THREE.Color(0.706, 0.044, 0.041) },
          resolution: { value: new THREE.Vector4() },
        },
        // wireframe: true,
        transparent: true,
        vertexShader: vertex,
        fragmentShader: heartfragment,
        // side: THREE.DoubleSide
        // depthTest: false,
        // depthWrite: false
      });

      // this.material = new THREE.ShaderMaterial({
      //   extensions: {
      //     derivatives: "#extension GL_OES_standard_derivatives : enable"
      //   },
      //   side: THREE.DoubleSide,
      //   uniforms: {
      //     time: { value: 0 },
      //     resolution: { value: new THREE.Vector4() },
      //   },
      //   wireframe: true,
      //   transparent: true,
      //   vertexShader: vertex,
      //   fragmentShader: fragment,
      //   // side: THREE.DoubleSide
      // });

      this.gltf.load(body, (gltf) => {
        resolve();
        this.body = gltf.scene.getObjectByName("material_Body");
        // console.log(this.body);
        this.body.material = this.fresnel.clone();

        // this.body.material =new THREE.MeshBasicMaterial({color: 0x000000});
        let s = 120;
        let s1 = s + 4;
        this.body.scale.set(s, s, s);
        this.scene.add(this.body);
        this.body1 = this.body.clone();
        // this.body1.position.x = -0.2
        this.body1.scale.set(s1, s1, s1);
        this.body1.material = this.fresnel.clone();

        // this.body1.material.uniforms.uOpacity.value = 0.5;
        this.body1.material.blending = THREE.CustomBlending;
        this.body1.material.blendEquation = THREE.AddEquation; //default
        this.body1.material.blendSrc = THREE.SrcColorFactor; //default
        this.body1.material.blendDst = THREE.OneMinusDstColorFactor; //default
        this.scene1.add(this.body1);
        this.body1.material.uniforms.uBias.value = 0.0;
        this.body1.material.uniforms.uFade.value = 0.2;
        this.body1.material.uniforms.uPower.value = 0.5;
        this.body.material.uniforms.uFade.value = 0.3;

        // this.body1.material.opacity = 0.5

        this.body.material.uniforms.uColor.value = new THREE.Color(
          0.241,
          0.043,
          0.355
        );
        this.body1.material.uniforms.uColor.value = new THREE.Color(
          0.048,
          0.079,
          0.601
        );

        this.body.material.uniforms.uColor.value = new THREE.Color("#E90817");
        this.body1.material.uniforms.uColor.value = new THREE.Color("#00f");

        // this.body1.material.blending = this.body.material.blending = THREE.AdditiveBlending
      });

      // this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

      // this.plane = new THREE.Mesh(this.geometry, this.material);
      // this.scene.add(this.plane);
    });
  }

  addHeart() {
    return new Promise((resolve, reject) => {
      this.gltf.load(heartRealSick, (gltf) => {
        resolve();
        this.heartreal = gltf.scene;
        // console.log(this.heartreal, "real heart");
        this.heartbody = this.heartreal.getObjectByName("vertex_cache_2");
        // this.heartMaterial = this.heartreal.getObjectByName('vertex_cache_4').material;
        this.heartreal.traverse((child) => {
          if (child.isMesh) {
            // child.material = this.heartMaterial;
            let mat = child.material.clone();

            child.material = this.process(mat, child.name);
            this.materials.push(child.material);
            // child.material.blending = THREE.AdditiveBlending;

            // child.material.uniforms.uColor.value = new THREE.Color('#ff0000')
            // child.material.uniforms.uBias.value = 0.3
            // child.material = new THREE.MeshBasicMaterial({color: 0xff0000});
          }
        });
        this.mixer = new THREE.AnimationMixer(this.heartreal);
        this.mixer.clipAction(gltf.animations[0]).play();
        this.groupHeart.add(this.heartreal);

        this.testmesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.01, 0.01, 0.01),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        this.sceneParticles.add(this.testmesh);
        this.testmesh.position.x = -0.0;
        this.testmesh.position.z = 0.03;
        this.testmesh.position.y = -0.05;
        this.testmesh.visible = false;

        this.sampler = new MeshSurfaceSampler(this.heartbody)
          .setWeightAttribute("uv")
          .build();

        let finalpositions = new Float32Array(this.number * 3);
        for (let i = 0; i < this.number; i++) {
          this.sampler.sample(this._position, this._normal);
          // console.log(this._position.x, this._position.y, this._position.z);
          this._position.multiplyScalar(0.05);
          this._position.z -= 0.01;
          this._position.x += 0.01;
          this._position.y -= 0.03;

          let testmesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.001, 0.001, 0.001),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
          );
          testmesh.position.copy(this._position);
          // this.groupHeart.add(testmesh)

          finalpositions.set(
            [this._position.x, this._position.y, this._position.z],
            i * 3
          );
        }

        this.geometry.setAttribute(
          "aFinalPosition",
          new THREE.BufferAttribute(finalpositions, 3)
        );
      });
    });
  }

  process(mat, name) {
    let color = new THREE.Color(1, 0, 0);
    let maskTexture = null;

    mat.transparent = true;
    let ttt = null;
    let maskshader = "";
    let bias = 0.4;
    let uVeins = 0;
    // mat.blending = THREE.AdditiveBlending;
    let veinsCheck = `
    
    
    
    vec4 veins = texture2D( uTexture, vUv );
    // gl_FragColor = vec4(vUv,0.,1.);
    // gl_FragColor.a = gl_FragColor.r;
    // gl_FragColor.rgb *= 2.*vec3(1.,0.5,0.5);
    gl_FragColor += vec4(veins.r,0.,0., veins.r);
    // gl_FragColor = blendOverlay(gl_FragColor.rgb, );
    
    
    `;
    // veins
    if (name === "vertex_cache_1") {
      color = new THREE.Color(0, 0, 1);
      veinsCheck = "";
      bias = 0.2;
      uVeins = 1;
      // mat.blending = THREE.AdditiveBlending;
    }
    if (name === "vertex_cache") {
      color = new THREE.Color(1, 0, 0);
      veinsCheck = "";
      bias = 0.0;
      uVeins = 1;
      // mat.blending = THREE.AdditiveBlending;
    }
    if (name === "vertex_cache_4") {
      ttt = this.t2;
    }
    if (name === "vertex_cache_3") {
      ttt = this.t1;
    }
    if (name === "vertex_cache_5") {
      ttt = this.t4;
    }
    if (name === "vertex_cache_2") {
      ttt = this.t3;
      maskTexture = this.mask;
      maskTexture.flipY = false;
      maskshader = `
      vec4 mmm = texture2D( uTextureMask, vUv );
      // gl_FragColor += 0.7*vec4(mmm.r*vec3(0.691, 0.355, 0.825), mmm.r);
      gl_FragColor = blendAdd(gl_FragColor, vec4(uColorSick,1.)*mmm.r,0.5*(1.-uHealth));
      // gl_FragColor = vec4(0.691, 0.355, 0.825,mmm.r);
      `;
    }

    if (ttt) ttt.flipY = false;

    mat.onBeforeCompile = (shader) => {
      // console.log(shader.fragmentShader);
      shader.uniforms.uColor = { value: color };
      shader.uniforms.uColor1 = {
        value: new THREE.Color(135 / 255, 11 / 255, 11 / 255),
      };
      shader.uniforms.uColorSick = {
        value: new THREE.Color(0.691, 0.355, 0.825),
      };
      shader.uniforms.uTexture = { value: ttt };
      shader.uniforms.uTextureMask = { value: maskTexture };
      shader.uniforms.uBias = { value: bias };
      shader.uniforms.uScale = { value: 1 };
      shader.uniforms.uPower = { value: 4 };
      shader.uniforms.uProgress = { value: 0 };
      shader.uniforms.uHealth = { value: 0 };
      shader.uniforms.uVeins = { value: uVeins };
      //prepend the input to the shader
      // shader.fragmentShader = 'uniform vec2 myValue;\n' + shader.fragmentShader
      // console.log(shader.fragmentShader, shader.vertexShader);
      //the rest is the same

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <output_fragment>",
        `#include <output_fragment>
        

        vec3 V = normalize(vWPosition.xyz - cameraPosition.xyz);    
        vec3 N = normalize(vWNormal);
        float uFade = 0.;
      
        float fresnel = uBias + uScale * pow(1.0 + dot(V, N), uPower);
        vec3 col = mix(uColor,vec3(1.),uFade);
        // vec3 col = mix(vec3(0.630, 0.165, 0.116),vec3(1.),uFade);
        vec3 finalColor = mix(vec3(0.),col*(1.-uFade),fresnel);
        gl_FragColor.rgb = mix(  gl_FragColor.rgb,vec3(finalColor),uProgress );
        gl_FragColor.a = mix(gl_FragColor.a,fresnel,uProgress);
        if(uVeins > 0.5){
          float f = 0.3+pow(1.0 + dot(V, N), uPower);
          gl_FragColor = vec4(vec3(f)*uColor,f);
          gl_FragColor.rgb += vec3(pow(1.0 + dot(V, N), 5.));
          // gl_FragColor.a = 0.5;
          // 
          
        } else{
          // veins
          
          ${veinsCheck}
          ${maskshader}
        }

        // color for distance
        
        vec4 distanceColor = vec4(0.);
        if(uVeins > 0.5){
          float f = pow(1.0 + dot(V, N), 4.);
          // gl_FragColor.rgb = vec3(f);
          // gl_FragColor.a = 1.;
          distanceColor = gl_FragColor+ vec4(vec3(f),f);
          // gl_FragColor.a = f;
          gl_FragColor.a = 1.;
        } else{
          // discard;
          // vec4 defaultColor = texture2D(map,vUv);
          float f = pow(1.0 + dot(V, N), 0.5);
          distanceColor = vec4(uColor1*f*diffuseColor.rgb,1.) + 0.3*vec4(f) + 0.3*diffuseColor.rgbr;
          distanceColor.rgb = pow(distanceColor.rgb,vec3(2.2));
          // distanceColor.rgb += diffuseColor.rgb*uColor1*fresnel;
        }

        // zoom in animation
        gl_FragColor = mix(distanceColor,gl_FragColor,uProgress);
        




        
        
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWPosition;
        varying vec3 vWNormal;
        // varying vec2 vUv;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
        vWPosition = (modelMatrix*vec4( transformed, 1.0 )).xyz;
        vWNormal = normalMatrix*normal;
        // vUv = uv;
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWPosition;
        varying vec3 vWNormal;
        // varying vec2 vUv;
        uniform vec3 uColor;
        uniform vec3 uColor1;
        uniform vec3 uColorSick;
        uniform float uBias;
        uniform float uPower;
        uniform float uScale;
        uniform float uProgress;
        uniform float uHealth;
        uniform float uVeins;
        uniform sampler2D uTexture;
        uniform sampler2D uTextureMask;
        vec3 gammaCorrection (vec3 colour, float gamma) {
            return pow(colour, vec3(1. / gamma));
          // return colour;
          }
          float blendOverlay(float base, float blend) {
            return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
          }
          
          vec3 blendOverlay(vec3 base, vec3 blend) {
            return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
          }
          vec4 blendOverlay(vec4 base, vec4 blend) {
            return vec4(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b),blendOverlay(base.a,blend.a));
          }
          
          vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
            return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
          }

          vec4 blendOverlay(vec4 base, vec4 blend, float opacity) {
            return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
          }

          float blendAdd(float base, float blend) {
            return min(base+blend,1.0);
          }
          
          vec3 blendAdd(vec3 base, vec3 blend) {
            return min(base+blend,vec3(1.0));
          }
          vec4 blendAdd(vec4 base, vec4 blend) {
            return min(base+blend,vec4(1.0));
          }
          
          vec3 blendAdd(vec3 base, vec3 blend, float opacity) {
            return (blendAdd(base, blend) * opacity + base * (1.0 - opacity));
          }
          vec4 blendAdd(vec4 base, vec4 blend, float opacity) {
            return (blendAdd(base, blend) * opacity + base * (1.0 - opacity));
          }
          
        `
      );
      mat.userData.shader = shader;
    };

    return mat;
    // return new THREE.MeshNormalMaterial()
  }

  addLights() {
    // const light1 = new THREE.AmbientLight(0xffffff, 0.5);
    // this.sceneHeart.add(light1);
    // const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    // light2.position.set(0.5, 0, 0.866); // ~60º
    // this.sceneHeart.add(light2);
    // new RGBELoader().load(hdr, (texture) => {
    //   // new EXRLoader().load(exr, (texture) => {
    //     // texture.mapping = THREE.EquirectangularReflectionMapping;
    //     // this.background = texture;
    //     const envMap = this.pmremGenerator.fromEquirectangular( texture ).texture;
    //     this.pmremGenerator.dispose();
    //     this.sceneHeart.environment = envMap;
    //     // this.sceneHeart.background = envMap;
    //   });
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.render();
    }
  }

  render() {
    if (!this.isPlaying) return;
    if (this.testmesh) this.positionTooltip();
    this.mouseTarget.lerp(this.mouse, 0.05);
    this.particleMaterial.uniforms.uTime.value = this.time;
    if(this.mobile){
      this.camera.position.z = lerp(0.8, 0.4, this.progress);
    } else{
      this.camera.position.z = lerp(0.7, 0.4, this.progress);
    }
    
    this.camera.lookAt(lerp(this.startX, this.endX, this.progress), 0, 0);
    this.time += 0.02;
    if (this.mixer) this.mixer.update(this.clock.getDelta() * this.heartbeat);

    this.setMaterialProgress(this.progress);
    requestAnimationFrame(this.render.bind(this));

    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.scene1, this.camera);
    this.renderer.clearDepth();

    // this.renderer.render(this.sceneParticles, this.camera);
    // this.renderer.clearDepth();

    this.groupHeart.rotation.y +=
      0.05 * (90 * this.targetRotation.x - this.groupHeart.rotation.y);
    this.targetRotation.y = clamp(60 * this.targetRotation.y, -1, 1) / 60;

    this.sceneParticles.rotation.y = this.groupHeart.rotation.y;

    this.renderer.render(this.sceneParticles, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.sceneHeart, this.camera);

    this.scene.rotation.y = 0.3 * this.mouseTarget.x * (1 - this.progress);
    this.scene1.rotation.y = 0.3 * this.mouseTarget.x * (1 - this.progress);
    this.sceneHeart.rotation.y = 0.3 * this.mouseTarget.x * (1 - this.progress);
  }
}

new Sketch({
  dom: document.getElementById("canvas"),
  mobile: () => window.matchMedia("(max-width: 600px)").matches,
  callback: ()=>{
    console.warn('ALL LOADED!!!')
  }
});
