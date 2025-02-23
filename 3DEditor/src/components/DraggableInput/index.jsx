import React, { useState, useRef, useEffect } from "react";

const DraggableInput = ({
  defaultValue = 1,
  onChange = () => {},
  className = "",
}) => {
  const [value, setValue] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startValue, setStartValue] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartValue(parseFloat(value) || defaultValue);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const scaleFactor = 0.05;
      let newValue = startValue + dx * scaleFactor;
      newValue = Math.round(newValue * 100) / 100;

      setValue(newValue);
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startX, startValue, onChange]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (!isNaN(parseFloat(newValue))) {
      onChange(parseFloat(newValue));
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleInputChange}
      onMouseDown={handleMouseDown}
      className={`w-24 h-10 text-black text-sm font-medium border rounded
        cursor-col-resize select-none focus:outline-none focus:ring-2 
        focus:ring-blue-500 hover:bg-gray-50 transition-colors
        flex items-center text-center leading-none
        ${className} ${
        isDragging ? "bg-gray-100 border-gray-400" : "border-gray-300"
      }`}
      style={{ lineHeight: "40px" }}
    />
  );
};

export default DraggableInput;
