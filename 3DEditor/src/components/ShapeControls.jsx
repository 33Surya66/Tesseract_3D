import { useRef, useState, Suspense, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  TransformControls,
  Text,
  useGLTF,
  useFBX,
  useTexture,
} from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { useLoader } from "@react-three/fiber";
import {
  createPrismGeometry,
  createCapsuleGeometry,
  createTubeGeometry,
  createArchGeometry,
  createStairsGeometry,
  createWallGeometry,
  createPyramidGeometry,
} from "./geometries";
import modelConfigs from "./modelConfigs.json";
import * as THREE from "three";

const useHoverAnimation = (
  ref,
  animationStates,
  shapeId,
  config = { rotationX: 0.2, rotationY: 0.5, lerpSpeed: 0.1 }
) => {
  useFrame((state) => {
    if (
      !ref.current ||
      !animationStates ||
      !animationStates[shapeId] ||
      !animationStates[shapeId].hovering
    ) {
      return;
    }

    const { mouse } = state;

    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      mouse.x * config.rotationY,
      config.lerpSpeed
    );

    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      mouse.y * config.rotationX,
      config.lerpSpeed
    );
  });
};

const Model = ({ modelId, isSelected }) => {
  const gltf = useGLTF(modelConfigs[modelId].path);
  const scene = gltf.scene.clone();
  const defaultScale = modelConfigs[modelId].scale;

  scene.traverse((node) => {
    if (node.isMesh) {
      node.material = node.material.clone();
      if (isSelected) {
        node.material.emissive.set("orange");
        node.material.emissiveIntensity = 1;
        node.material.transparent = true;
        node.material.opacity = 0.5;
      } else {
        node.material.emissiveIntensity = 0;
        node.material.transparent = false;
        node.material.opacity = 1;
      }
    }
  });

  scene.scale.set(defaultScale, defaultScale, defaultScale);
  return <primitive object={scene} />;
};

const ImportedModel = ({ shape, isSelected }) => {
  try {
    switch (shape.modelType) {
      case "glb":
      case "gltf": {
        const model = useLoader(GLTFLoader, shape.modelUrl);
        useEffect(() => {
          model.scene.traverse((node) => {
            if (node.isMesh) {
              const material = node.material.clone();
              // Reset material properties when not selected
              material.emissive = new THREE.Color(
                isSelected ? "orange" : "black"
              );
              material.emissiveIntensity = isSelected ? 0.5 : 0;
              material.transparent = isSelected;
              material.opacity = isSelected ? 0.8 : 1;
              node.material = material;
            }
          });
        }, [isSelected, model.scene]);
        return <primitive object={model.scene} />;
      }

      case "obj": {
        const objModel = useLoader(OBJLoader, shape.modelUrl);
        useEffect(() => {
          objModel.traverse((node) => {
            if (node.isMesh) {
              const material = node.material.clone();
              // Reset material properties when not selected
              material.emissive = new THREE.Color(
                isSelected ? "orange" : "black"
              );
              material.emissiveIntensity = isSelected ? 0.5 : 0;
              material.transparent = isSelected;
              material.opacity = isSelected ? 0.8 : 1;
              node.material = material;
            }
          });
        }, [isSelected, objModel]);
        return <primitive object={objModel} />;
      }

      case "stl": {
        const geometry = useLoader(STLLoader, shape.modelUrl);
        return (
          <mesh geometry={geometry}>
            <meshStandardMaterial
              color={shape.color || "#888888"}
              emissive={isSelected ? "orange" : "black"}
              emissiveIntensity={isSelected ? 0.5 : 0}
              transparent={isSelected}
              opacity={isSelected ? 0.8 : 1}
            />
          </mesh>
        );
      }

      default:
        return null;
    }
  } catch (error) {
    console.error("Error loading model:", error);
    return null;
  }
};

const ShapeControls = ({
  shape,
  setShapes,
  onClick,
  isSelected,
  selectedObject,
  updateObject,
  mode = "translate",
  animationStates = {},
  shapeAnimationData,
  currentFrame,
}) => {
  const meshRef = useRef();
  const transformRef = useRef();
  const [offset] = useState(Math.random() * Math.PI * 2);
  const initialPosition = shape.position;

  useHoverAnimation(meshRef, animationStates, shape.id);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...shape.position);
      meshRef.current.rotation.set(...shape.rotation);
    }
  }, [shape]);

  useFrame(({ clock }) => {
    if (!meshRef.current || !animationStates[shape.id]) return;

    const animations = animationStates[shape.id];
    const basePosition = Array.isArray(initialPosition)
      ? initialPosition
      : [0, 0, 0];
    let newPosition = [...basePosition];
    let newScale = shape.scale || 1;

    if (animations?.rotating) {
      meshRef.current.rotation.y += 0.02;
    }
    if (animations?.floating) {
      newPosition[1] =
        basePosition[1] + Math.sin(clock.elapsedTime + offset) * 0.2;
    }
    if (animations?.scaling) {
      newScale = shape.scale * (1 + Math.sin(clock.elapsedTime * 2) * 0.2);
    }
    if (animations?.pulsing) {
      newScale = shape.scale * (1 + Math.sin(clock.elapsedTime * 4) * 0.1);
    }
    if (animations?.bouncing) {
      newPosition[1] =
        basePosition[1] + Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.3;
    }

    meshRef.current.position.set(...newPosition);
    if (newScale !== shape.scale) {
      meshRef.current.scale.set(newScale, newScale, newScale);
    }
  });

  const lerp = (start, end, t) => {
    if (Array.isArray(start)) {
      return start.map((s, i) => s + (end[i] - s) * t);
    }
    return start + (end - start) * t;
  };

  const findNearestKeyframes = (frameData, currentFrame) => {
    if (!frameData) return { before: null, after: null };

    const frames = Object.keys(frameData)
      .map(Number)
      .sort((a, b) => a - b);

    const beforeFrame = frames.reduce((prev, frame) => {
      if (frame <= currentFrame && frame > prev) return frame;
      return prev;
    }, -Infinity);

    const afterFrame = frames.reduce((prev, frame) => {
      if (frame > currentFrame && (prev === Infinity || frame < prev))
        return frame;
      return prev;
    }, Infinity);

    return {
      before: beforeFrame === -Infinity ? null : beforeFrame,
      after: afterFrame === Infinity ? null : afterFrame,
    };
  };

  const getInterpolatedValues = (frameData, currentFrame) => {
    if (!frameData) return null;

    const { before, after } = findNearestKeyframes(frameData, currentFrame);

    if (before === null && after === null) return null;
    if (after === null) return frameData[before];
    if (before === null) return frameData[after];

    const t = (currentFrame - before) / (after - before);

    return {
      position: lerp(frameData[before].position, frameData[after].position, t),
    };
  };

  if (shape.isHidden) return null;

  const isModelType = Object.keys(modelConfigs).includes(shape.type);
  const texture = shape.texturePath ? useTexture(shape.texturePath) : null;
  const finalScale = isModelType
    ? shape.scale * (modelConfigs[shape.type]?.scale || 1)
    : shape.scale;

  return (
    <TransformControls
      ref={transformRef}
      object={meshRef.current}
      mode={mode}
      enabled={isSelected}
    >
      <Suspense fallback={null}>
        <mesh
          ref={meshRef}
          position={
            getInterpolatedValues(shapeAnimationData, currentFrame)?.position ||
            shape.position
          }
          scale={[finalScale, finalScale, finalScale]}
          rotation={shape.rotation}
          onClick={onClick}
          castShadow
        >
          {isModelType ? (
            <Model modelId={shape.type} isSelected={isSelected} />
          ) : shape.type === "importedModel" ? (
            <ImportedModel shape={shape} isSelected={isSelected} />
          ) : (
            <>
              {shape.type === "cube" && <boxGeometry args={[1, 1, 1]} />}
              {shape.type === "sphere" && (
                <sphereGeometry args={[0.7, 32, 32]} />
              )}
              {shape.type === "cylinder" && (
                <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
              )}
              {shape.type === "cone" && <coneGeometry args={[0.5, 1, 32]} />}
              {shape.type === "torus" && (
                <torusGeometry args={[0.5, 0.2, 16, 100]} />
              )}
              {shape.type === "plane" && <planeGeometry args={[2, 2]} />}
              {shape.type === "pyramid" && (
                <primitive object={createPyramidGeometry()} />
              )}
              {shape.type === "tetrahedron" && (
                <tetrahedronGeometry args={[0.8]} />
              )}
              {shape.type === "octahedron" && (
                <octahedronGeometry args={[0.8]} />
              )}
              {shape.type === "dodecahedron" && (
                <dodecahedronGeometry args={[0.8]} />
              )}
              {shape.type === "icosahedron" && (
                <icosahedronGeometry args={[0.8]} />
              )}
              {shape.type === "prism" && (
                <primitive object={createPrismGeometry()} />
              )}
              {shape.type === "capsule" && (
                <primitive object={createCapsuleGeometry()} />
              )}
              {shape.type === "tube" && (
                <primitive object={createTubeGeometry()} />
              )}
              {shape.type === "arch" && (
                <primitive object={createArchGeometry()} />
              )}
              {shape.type === "stairs" && (
                <primitive object={createStairsGeometry()} />
              )}
              {shape.type === "wall" && (
                <primitive object={createWallGeometry()} />
              )}

              <meshStandardMaterial
                color={isSelected ? "yellow" : shape.color}
                map={texture}
                emissive={isSelected ? "orange" : "black"}
                emissiveIntensity={isSelected ? 1 : 0}
                transparent={true}
                opacity={isSelected ? 0.5 : 1}
              />
            </>
          )}
        </mesh>
      </Suspense>
    </TransformControls>
  );
};

// Preload models
Object.values(modelConfigs).forEach((config) => {
  useGLTF.preload(config.path);
});

export default ShapeControls;
