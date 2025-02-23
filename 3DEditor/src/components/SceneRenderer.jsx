import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  GizmoHelper,
  OrbitControls,
  GizmoViewport,
  Stars,
  Sky,
  Cloud,
  Environment,
} from "@react-three/drei";
import ShapeControls from "./ShapeControls";
import AnimationTimeline from "./Timeline";
import Grid from "./Grid";
import { ExportButton } from "./ExportButton";

const SceneRenderer = ({
  shapes,
  setShapes,
  selectedObject,
  setSelectedObject,
  background,
  isRotationEnabled,
  updateObject,
  currentFrame,
  setCurrentFrame,
  animationData,
}) => {
  const [keyframes, setKeyframes] = useState({});
  const [environment, setEnvironment] = useState("none");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [animationStates, setAnimationStates] = useState({});

  useEffect(() => {
    setKeyframes(animationData[selectedObject?.id] || {});
  }, [selectedObject, animationData]);

  const handleTimeUpdate = (frame) => {
    // Add any frame update logic here
    console.log("Frame updated:", frame);
  };

  const EnvironmentWrapper = ({ type }) => {
    switch (type) {
      case "stars":
        return <Stars count={5000} depth={50} factor={4} saturation={0} fade speed={1} />;
      case "sky":
        return <Sky sunPosition={[0, 1, 0]} />;
      case "clouds":
        return (
          <Cloud 
            position={[0, 15, 0]}
            opacity={0.7}
            speed={0.4}
            width={10}
            depth={1.5}
            segments={20}
          />
        );
      case "sunset":
        return <Environment preset="sunset" background blur={0.4} />;
      case "color":
        return <color attach="background" args={[backgroundColor]} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="w-[78vw] h-screen flex flex-col relative"
      style={{
        background: environment === "color" ? backgroundColor : background,
      }}
    >
      {/* Environment Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <select
          value={environment}
          onChange={(e) => setEnvironment(e.target.value)}
          className="p-2 bg-gray-800 text-white rounded border border-gray-700 hover:bg-gray-700 transition-colors"
        >
          <option value="none">No Environment</option>
          <option value="stars">Stars</option>
          <option value="sky">Sky</option>
          <option value="clouds">Clouds</option>
          <option value="sunset">Sunset</option>
          <option value="color">Solid Color</option>
        </select>

        {environment === "color" && (
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-gray-700"
          />
        )}

        <ExportButton 
          shapes={shapes}
          environment={environment}
          backgroundColor={backgroundColor}
        />
      </div>

      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ background: environment === "none" ? background : "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />
        
        <OrbitControls enableRotate={isRotationEnabled} makeDefault />
        <EnvironmentWrapper type={environment} />
        <Grid />

        {shapes.map((shape) => (
          <ShapeControls
            key={shape.id}
            shape={shape}
            setShapes={setShapes}
            updateObject={updateObject}
            onClick={() => setSelectedObject(shapes.find((s) => s.id === shape.id))}
            isSelected={selectedObject?.id === shape.id}
            selectedObject={selectedObject}
            animationStates={animationStates}
            shapeAnimationData={animationData[shape.id]}
            currentFrame={currentFrame}
          />
        ))}

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport
            axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]}
            labelColor="white"
          />
        </GizmoHelper>
      </Canvas>

      <AnimationTimeline
        currentFrame={currentFrame}
        setCurrentFrame={setCurrentFrame}
        keyframes={keyframes}
        onTimeUpdate={handleTimeUpdate}
        animationStates={animationStates}
        setAnimationStates={setAnimationStates}
        selectedObject={selectedObject}
      />
    </div>
  );
};

export default SceneRenderer;