import React, { useCallback, useState } from "react";
import { Upload, Loader } from "lucide-react";

const ModelImporter = ({ addShape }) => {
  const [isUploading, setIsUploading] = useState(false);
  const supportedFormats = [".glb", ".gltf", ".obj", ".stl"];

  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const extension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf("."));
      if (!supportedFormats.includes(extension)) {
        alert(
          `Unsupported file format. Please use: ${supportedFormats.join(", ")}`
        );
        return;
      }

      try {
        setIsUploading(true);

        const formData = new FormData();
        formData.append("model", file);

        const response = await fetch(
          "https://tesseract-3d-a006.onrender.com/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();

        // Create a new shape with both URLs
        const newShape = {
          id: Date.now(),
          type: "importedModel",
          modelUrl: data.downloadUrl, // URL for loading in the viewer
          modelType: extension.slice(1),
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: 1,
          color: "#888888",
          name: file.name,
        };

        addShape(newShape);
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Error uploading file. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [addShape]
  );

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold mb-2 text-gray-200">Import Model</h3>
      <label className="flex flex-col items-center p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-[#6069fa] cursor-pointer transition-colors bg-[#1e2127]">
        {isUploading ? (
          <Loader size={24} className="mb-2 animate-spin text-[#6069fa]" />
        ) : (
          <Upload size={24} className="mb-2 text-gray-400" />
        )}
        <span className="text-sm text-center text-gray-200">
          {isUploading ? "Uploading..." : "Upload 3D Model"}
        </span>
        <span className="text-xs text-gray-500 mt-1">
          {supportedFormats.join(", ")}
        </span>
        <input
          type="file"
          accept={supportedFormats.join(",")}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
      </label>
    </div>
  );
};

export default ModelImporter;
