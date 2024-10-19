// components/UploadFile.tsx
import React, { useState } from "react";
import axios from "axios";

interface BlobObject {
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
}

interface NewlyCreated {
  newlyCreated: {
    blobObject: BlobObject;
    encodedSize: number;
    cost: number;
  };
}

interface AlreadyCertified {
  alreadyCertified: {
    blobId: string;
    eventOrObject: {
      Event: {
        txDigest: string;
        eventSeq: string;
      };
    };
    endEpoch: number;
  };
}

type UploadResponse = NewlyCreated | AlreadyCertified;

const UploadFile: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null); // Reset error when a new file is selected
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setLoading(true);
    setError(null); // Reset previous errors
    setUploadResult(null); // Reset previous results

    try {
      const fileContent = await file.text(); // Read the file content as a string

      // Make the PUT request to upload to Walrus
      const response = await axios.put<UploadResponse>(`${process.env.NEXT_PUBLIC_PUBLISHER}/v1/store`, fileContent, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setUploadResult(response.data);

      if ("newlyCreated" in response.data) {
        console.log("File uploaded successfully!");
        console.log("blobId:", response.data.newlyCreated.blobObject.blobId);
      } else if ("alreadyCertified" in response.data) {
        console.log("Data has already been uploaded.");
        console.log("blobId:", response.data.alreadyCertified.blobId);
        setError("Data has already been uploaded.");
      }

      setLoading(false);
    } catch (error: any) {
      console.error("Error uploading the file:", error);
      setError("An error occurred while uploading the file.");
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

      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded">
          <p>{error}</p>
          {uploadResult && "alreadyCertified" in uploadResult && (
            <p>
              Blob ID: <span className="font-mono">{uploadResult.alreadyCertified.blobId}</span>
            </p>
          )}
        </div>
      )}

      {uploadResult && "newlyCreated" in uploadResult && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Upload Result:</h2>
          <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(uploadResult.newlyCreated.blobObject, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default UploadFile;
