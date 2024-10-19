// components/UploadFile.tsx
import React, { useState } from "react";
import axios from "axios";

interface UploadResult {
  newlyCreated: {
    blobObject: {
      id: string;
      storedEpoch: number;
      blobId: string;
      size: number;
      erasureCodeType: string;
      certifiedEpoch: number;
      storage: {
        id: string;
        startEpoch: number;
        endEpoch: number;
        storageSize: number;
      };
    };
    encodedSize: number;
    cost: number;
  };
}

const UploadFile: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setLoading(true);

    try {
      const fileContent = await file.text(); // Read the file content as a string

      // Make the PUT request to upload to Walrus
      const response = await axios.put(`${process.env.NEXT_PUBLIC_PUBLISHER}/v1/store`, fileContent);

      setUploadResult(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error uploading the file:", error);
      setLoading(false);
    }
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Upload JSON File</h1>

      <input
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="file-input file-input-bordered file-input-primary w-full max-w-xs"
      />

      <button
        onClick={handleFileUpload}
        className={`btn btn-primary mt-4 ${loading ? "loading" : ""}`}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {uploadResult && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Upload Result:</h2>
          <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(uploadResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default UploadFile;
