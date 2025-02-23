import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import SceneRenderer from "../SceneRenderer";
import useKeyboardShortcuts from "../../hooks/useKeyboardShortcuts";
import ObjectProperties from "../ObjectProperties";
import useAnimationControls from "../../hooks/useAnimationControls";

const shapeLibrary = {
  basic: [
    { id: "cube", name: "Cube", icon: "⧈" },
    { id: "sphere", name: "Sphere", icon: "○" },
    { id: "cylinder", name: "Cylinder", icon: "⌭" },
    { id: "cone", name: "Cone", icon: "△" },
    { id: "torus", name: "Torus", icon: "◎" },
    { id: "pyramid", name: "Pyramid", icon: "△" },
  ],
  platonic: [
    { id: "tetrahedron", name: "Tetrahedron", icon: "△" },
    { id: "octahedron", name: "Octahedron", icon: "◇" },
    { id: "dodecahedron", name: "Dodecahedron", icon: "⬡" },
    { id: "icosahedron", name: "Icosahedron", icon: "◈" },
  ],
  geometric: [
    { id: "prism", name: "Prism", icon: "⬢" },
    { id: "capsule", name: "Capsule", icon: "⬭" },
    { id: "tube", name: "Tube", icon: "⌽" },
  ],
  architectural: [
    { id: "arch", name: "Arch", icon: "⌓" },
    { id: "stairs", name: "Stairs", icon: "⌶" },
    { id: "wall", name: "Wall", icon: "▯" },
  ],
  furniture: [
    { id: "chair", name: "Chair", icon: "🪑" },
    { id: "table", name: "Table", icon: "🪟" },
    { id: "bed", name: "Bed", icon: "🛏" },
    { id: "cabinet", name: "Cabinet", icon: "🗄" },
  ],
  vehicles: [
    { id: "car", name: "Car", icon: "🚗" },
    { id: "bus", name: "Bus", icon: "🚌" },
    { id: "motorcycle", name: "Motorcycle", icon: "🏍" },
    { id: "airplane", name: "Airplane", icon: "✈" },
  ],
  household: [
    { id: "book", name: "Book", icon: "📖" },
    { id: "bottle", name: "Bottle", icon: "🍶" },
    { id: "plate", name: "Plate", icon: "🍽" },
  ],
  characters: [
    { id: "man", name: "Man", icon: "👨" },
    { id: "woman", name: "Woman", icon: "👩" },
    { id: "dog", name: "Dog", icon: "🐕" },
  ],
  electronics: [
    { id: "phone", name: "Phone", icon: "📱" },
    { id: "computer", name: "Computer", icon: "💻" },
    { id: "tv", name: "TV", icon: "📺" },
  ],
};

const defaultObject = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  color: "#888888",
  scale: 1,
};

const Playground = () => {
  const {
    animationStates,
    toggleAnimation,
    removeAnimation,
    getShapeAnimations,
  } = useAnimationControls();

  const [shapes, setShapes] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [background, setBackground] = useState("#111111");
  const [isRotationEnabled, setIsRotationEnabled] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [animationData, setAnimationData] = useState({});
  const [pendingSelection, setPendingSelection] = useState(null);

  useEffect(() => {
    if (pendingSelection) {
      const timer = setTimeout(() => {
        setSelectedObject(null);
        setPendingSelection(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pendingSelection]);

  const findShapeIcon = (shapeType) => {
    for (const category of Object.values(shapeLibrary)) {
      const shape = category.find((item) => item.id === shapeType);
      if (shape) return shape.icon;
    }
    return "⬡";
  };

  const initializeAnimationData = (shape) => {
    setAnimationData((prev) => ({
      ...prev,
      [shape.id]: {
        0: {
          position: [...shape.position],
          rotation: [...shape.rotation],
          scale: shape.scale,
        },
      },
    }));
  };

  const addShape = (shapeData) => {
    const shapeId = Date.now();
    let newShape;

    if (typeof shapeData === "string") {
      // Library shapes
      newShape = {
        ...defaultObject,
        id: shapeId,
        type: shapeData,
        icon: findShapeIcon(shapeData),
      };
    } else {
      // Imported models
      newShape = {
        ...defaultObject,
        ...shapeData,
        id: shapeId,
      };
    }

    // Save current state to history
    setHistory((prev) => [...prev, shapes]);

    // Add new shape
    setShapes((prev) => [...prev, newShape]);

    // Initialize animation data
    initializeAnimationData(newShape);

    // Handle selection based on shape type
    if (typeof shapeData === "string") {
      setSelectedObject(newShape);
    } else {
      setSelectedObject(null);
      setPendingSelection(newShape);
    }
  };

  const updateObject = (updates) => {
    if (!selectedObject) return;

    // Update animation data
    setAnimationData((prev) => ({
      ...prev,
      [selectedObject.id]: {
        ...prev[selectedObject.id],
        [currentFrame]: {
          position:
            updates.position ||
            prev[selectedObject.id]?.[currentFrame]?.position,
          rotation:
            updates.rotation ||
            prev[selectedObject.id]?.[currentFrame]?.rotation,
          scale:
            updates.scale || prev[selectedObject.id]?.[currentFrame]?.scale,
        },
      },
    }));

    // Update shape
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === selectedObject.id ? { ...shape, ...updates } : shape
      )
    );
  };

  const deleteShape = () => {
    if (!selectedObject) return;

    // Cleanup resources
    if (selectedObject.modelUrl) {
      URL.revokeObjectURL(selectedObject.modelUrl);
    }

    // Remove animation data
    setAnimationData((prev) => {
      const newData = { ...prev };
      delete newData[selectedObject.id];
      return newData;
    });

    // Remove shape
    setShapes((prev) => prev.filter((shape) => shape.id !== selectedObject.id));
    setSelectedObject(null);
  };

  const undo = () => {
    if (history.length > 0) {
      setShapes(history[history.length - 1]);
      setHistory((prev) => prev.slice(0, -1));
      setSelectedObject(null);
    }
  };

  const unselect = () => {
    setSelectedObject(null);
  };

  useKeyboardShortcuts({
    deleteShape,
    undo,
    unselect,
    setIsRotationEnabled,
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1">
        <Sidebar
          shapes={shapes}
          setShapes={setShapes}
          addShape={addShape}
          selectedObject={selectedObject}
          setSelectedObject={setSelectedObject}
          updateObject={updateObject}
          setBackground={setBackground}
          animationStates={animationStates}
          toggleAnimation={toggleAnimation}
          removeAnimation={removeAnimation}
          getShapeAnimations={getShapeAnimations}
        />
        <SceneRenderer
          shapes={shapes}
          setShapes={setShapes}
          selectedObject={selectedObject}
          setSelectedObject={setSelectedObject}
          background={background}
          isRotationEnabled={isRotationEnabled}
          currentFrame={currentFrame}
          setCurrentFrame={setCurrentFrame}
          updateObject={updateObject}
          animationData={animationData}
          animationStates={animationStates}
        />
        <ObjectProperties
          shapes={shapes}
          selectedObject={selectedObject}
          updateObject={updateObject}
          deleteShape={deleteShape}
          undo={undo}
          unselect={unselect}
        />
      </div>
    </div>
  );
};

export default Playground;
