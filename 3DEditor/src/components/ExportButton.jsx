import { geometryDefinitions } from "./geometryDefinition";
import modelConfigs from "./modelConfigs.json";

// Function to analyze which geometries and models are used
const analyzeShapeUsage = (shapes) => {
  const usedGeometries = new Set();
  const usedImportedModels = new Set();
  const usedModels = new Set();
  const basicShapes = new Set();

  shapes.forEach((shape) => {
    if (shape.type === "importedModel") {
      usedImportedModels.add(shape.modelType);
    } else if (modelConfigs[shape.type]) {
      usedModels.add(shape.type);
    } else if (geometryDefinitions[shape.type]) {
      usedGeometries.add(shape.type);
    } else {
      basicShapes.add(shape.type);
    }
  });

  return { usedGeometries, usedModels, usedImportedModels, basicShapes };
};

// Generate imports section with environment components
const generateImports = (usedGeometries, basicShapes, environment) => {
  const baseImports = `import React, { Suspense, useRef, useEffect } from 'react';
  import { Canvas } from '@react-three/fiber';
  import { OrbitControls } from '@react-three/drei';
  import { useGLTF } from "@react-three/drei";
  import { useTexture } from "@react-three/drei";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
  import { useLoader } from "@react-three/fiber";
  import * as THREE from 'three';`;

  const environmentImports = environment !== 'none' ? 
    `import { ${environment === 'stars' ? 'Stars' : 
               environment === 'sky' ? 'Sky' : 
               environment === 'clouds' ? 'Cloud' : 
               'Environment'} } from '@react-three/drei';` : '';

  return `${baseImports}
  ${environmentImports}`;
};

const generateGeometryFunctions = (usedGeometries) => {
  return Array.from(usedGeometries)
    .map((type) => geometryDefinitions[type])
    .join("\n\n");
};

const generateCustomGeometryComponent = (usedGeometries) => {
  if (usedGeometries.size === 0) return "";

  const geometrySwitch = Array.from(usedGeometries)
    .map(
      (type) => `      case '${type}':
          geometry = create${type.charAt(0).toUpperCase() + type.slice(1)}Geometry();
          break;`
    )
    .join("\n");

  return `
  const CustomGeometry = ({ type, ...props }) => {
    const geometryRef = useRef();
    
    useEffect(() => {
      let geometry;
      switch(type) {
  ${geometrySwitch}
      }
      if (geometryRef.current) {
        geometryRef.current.geometry = geometry;
      }
    }, [type]);
  
    return <mesh ref={geometryRef} {...props} />;
  };`;
};

const generateModelComponent = (usedModels) => {
  if (usedModels.size === 0) return "";

  return `
    const Model = ({ modelPath, position, rotation, scale, defaultScale = 1 }) => {
      const gltf = useGLTF(modelPath);
      const scene = gltf.scene.clone();
      
      scene.traverse((node) => {
        if (node.isMesh) {
          node.material = node.material.clone();
          node.material.emissiveIntensity = 0;
          node.material.transparent = false;
          node.material.opacity = 1;
        }
      });
      
      scene.position.set(...position);
      scene.rotation.set(...rotation);
      scene.scale.set(scale * defaultScale, scale * defaultScale, scale * defaultScale);
      
      return <primitive object={scene} />;
    };`;
};

const generateImportedModelComponent = (usedImportedModels) => {
  if (usedImportedModels.size === 0) return "";

  return `const ImportedModel = ({ shape }) => {
    try {
      switch (shape.modelType) {
        case "glb":
        case "gltf":
          const model = useLoader(GLTFLoader, shape.modelUrl);
          return <primitive object={model.scene} />;
        case "obj":
          const objModel = useLoader(OBJLoader, shape.modelUrl);
          return <primitive object={objModel} />;
        case "stl":
          const geometry = useLoader(STLLoader, shape.modelUrl);
          return (
            <mesh geometry={geometry}>
              <meshStandardMaterial
                color={shape.color}
                opacity={1}
              />
            </mesh>
          );
        default:
          return null;
      }
    } catch (error) {
      console.error("Error loading model:", error);
      return null;
    }
  };`;
};

const generateEnvironmentComponent = (environment, backgroundColor) => {
  switch (environment) {
    case 'stars':
      return '<Stars count={5000} depth={50} factor={4} saturation={0} fade speed={1} />';
    case 'sky':
      return '<Sky sunPosition={[0, 1, 0]} />';
    case 'clouds':
      return '<Cloud position={[0, 15, 0]} opacity={0.7} speed={0.4} width={10} depth={1.5} segments={20} />';
    case 'sunset':
      return '<Environment preset="sunset" background blur={0.4} />';
    case 'color':
      return `<color attach="background" args={['${backgroundColor}']} />`;
    default:
      return '';
  }
};

const generateShapeJSX = (shape) => {
  const { position, rotation, scale, color, type, texturePath } = shape;
  const pos = `[${position.join(", ")}]`;
  const rot = `[${rotation.join(", ")}]`;

  const isModelType = modelConfigs[type];
  const texture = texturePath ? `useTexture('${texturePath}')` : "null";

  if (shape.type === "importedModel") {
    return `<ImportedModel shape={${JSON.stringify(shape)}} />`;
  }

  if (isModelType) {
    return `<Model modelPath="${modelConfigs[type].path}" position={${pos}} rotation={${rot}} scale={${scale}} defaultScale={${modelConfigs[type].scale}} />`;
  }

  if (geometryDefinitions[type]) {
    return `<CustomGeometry
                type="${type}"
                position={${pos}}
                rotation={${rot}}
                scale={[${scale}, ${scale}, ${scale}]}>
                <meshStandardMaterial color="${color}" />
              </CustomGeometry>`;
  }

  return `<mesh position={${pos}} rotation={${rot}} scale={[${scale}, ${scale}, ${scale}]}>
              <${type}Geometry />
              <meshStandardMaterial color="${color}" map={${texture}} />
            </mesh>`;
};

export const exportScene = (shapes, environment = 'none', backgroundColor = '#000000') => {
  const { usedGeometries, usedModels, usedImportedModels, basicShapes } =
    analyzeShapeUsage(shapes);

  const componentCode = `${generateImports(usedGeometries, basicShapes, environment)}
    
    ${generateGeometryFunctions(usedGeometries)}
    ${generateCustomGeometryComponent(usedGeometries)}
    ${generateModelComponent(usedModels)}
    ${generateImportedModelComponent(usedImportedModels)}
    
  const CompiledScene = () => {
    return (
      <div className="absolute inset-0" ${environment === 'color' ? `style={{ background: '${backgroundColor}' }}` : ''}>
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-5, 5, -5]} intensity={0.5} />
          <OrbitControls makeDefault />
          <Suspense fallback={null}>
            ${generateEnvironmentComponent(environment, backgroundColor)}
            ${shapes.map((shape) => generateShapeJSX(shape)).join("\n            ")}
          </Suspense>
        </Canvas>
      </div>
    );
  };
  
  export default CompiledScene;`;

  const blob = new Blob([componentCode], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "CompiledScene.jsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
export const ExportButton = ({ shapes, environment, backgroundColor }) => {
  return (
    <button
      onClick={() => exportScene(shapes, environment, backgroundColor)}
      className="px-5 py-2.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-base cursor-pointer"
    >
      Export Scene
    </button>
  );
};