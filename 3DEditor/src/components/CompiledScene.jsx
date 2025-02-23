import React, { Suspense, useRef, useEffect } from 'react';
  import { Canvas } from '@react-three/fiber';
  import { OrbitControls } from '@react-three/drei';
  import { useGLTF } from "@react-three/drei";
  import { useTexture } from "@react-three/drei";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
  import { useLoader } from "@react-three/fiber";
  import * as THREE from 'three';
  import { Sky } from '@react-three/drei';
    
    const createPyramidGeometry = () => {
    return new THREE.ConeGeometry(1, 1.5, 4);
  };
    
  const CustomGeometry = ({ type, ...props }) => {
    const geometryRef = useRef();
    
    useEffect(() => {
      let geometry;
      switch(type) {
        case 'pyramid':
          geometry = createPyramidGeometry();
          break;
      }
      if (geometryRef.current) {
        geometryRef.current.geometry = geometry;
      }
    }, [type]);
  
    return <mesh ref={geometryRef} {...props} />;
  };
    
    
    
  const CompiledScene = () => {
    return (
      <div className="absolute inset-0" >
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-5, 5, -5]} intensity={0.5} />
          <OrbitControls makeDefault />
          <Suspense fallback={null}>
            <Sky sunPosition={[0, 1, 0]} />
            <CustomGeometry
                type="pyramid"
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
                scale={[1, 1, 1]}>
                <meshStandardMaterial color="#888888" />
              </CustomGeometry>
          </Suspense>
        </Canvas>
      </div>
    );
  };
  
  export default CompiledScene;