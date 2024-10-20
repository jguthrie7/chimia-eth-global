import React, { useState } from "react";
import axios from "axios";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

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
  const [blobId, setBlobId] = useState<string | null>(null);
  const [nftBlobId, setNftBlobId] = useState<string | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]); // New state for log messages
  const { writeContractAsync } = useScaffoldWriteContract("Experiments");
  const { address } = useAccount();

  const addLogMessage = (message: string) => {
    // setLogMessages(prevMessages => [message, ...prevMessages]);
    setLogMessages(prevMessages => [message]);
  };

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
      const parsedFileContent = JSON.parse(fileContent);

      addLogMessage("Parsing file content...");
      const nftMetadata = {
        name: parsedFileContent.reaction.name,
        description: parsedFileContent.reaction.description,
        image: parsedFileContent.nft_metadata.image,
        attributes: [
          {
            trait_type: "Trait Type",
            value: "Trait Value",
          },
        ],
      };

      nftMetadata.attributes = [];

      // Log the parsed metadata
      addLogMessage(`Parsed NFT Metadata`);

      // Make the PUT request to upload to Walrus
      addLogMessage("Uploading file to Walrus...");
      const response = await axios.put<UploadResponse>(`${process.env.NEXT_PUBLIC_PUBLISHER}/v1/store`, fileContent, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      let tempBlobId = "";
      let tempNftBlobId = "";

      if ("newlyCreated" in response.data) {
        addLogMessage("File uploaded successfully!");
        tempBlobId = response.data.newlyCreated.blobObject.blobId;
        addLogMessage(`Blob ID: ${tempBlobId}`);
      } else if ("alreadyCertified" in response.data) {
        addLogMessage("Data has already been uploaded.");
        tempBlobId = response.data.alreadyCertified.blobId;
        // setError("Data has already been uploaded.");
      }

      for (const [key, value] of Object.entries(parsedFileContent.nft_metadata)) {
        if (key === "image") continue;
        nftMetadata.attributes.push({
          trait_type: key,
          value: value as string,
        });
      }

      if (tempBlobId) {
        nftMetadata.attributes.push({
          trait_type: "Full Results",
          value: `https://aggregator.walrus-testnet.walrus.space/v1/${tempBlobId}`,
        });
      }

      addLogMessage("Uploading NFT metadata to Walrus...");
      const responseNFT = await axios.put<UploadResponse>(
        `${process.env.NEXT_PUBLIC_PUBLISHER}/v1/store`,
        nftMetadata,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      addLogMessage("NFT metadata uploaded successfully.");

      setUploadResult(response.data);

      if ("newlyCreated" in responseNFT.data) {
        tempNftBlobId = responseNFT.data.newlyCreated.blobObject.blobId;
        addLogMessage(`NFT Blob ID: ${tempNftBlobId}`);
      } else if ("alreadyCertified" in responseNFT.data) {
        tempNftBlobId = responseNFT.data.alreadyCertified.blobId;
        addLogMessage(`NFT Blob ID (already certified): ${tempNftBlobId}`);
        // setError("Data has already been uploaded.");
      }

      setBlobId(tempBlobId);
      setNftBlobId(tempNftBlobId);
      setLoading(false);

      addLogMessage("Minting NFT...");
      const tx = await writeContractAsync({
        functionName: "mint",
        args: [address, "https://aggregator.walrus-testnet.walrus.space/v1/" + tempNftBlobId],
      });
      addLogMessage(`Transaction: ${JSON.stringify(tx)}`);
      addLogMessage("NFT minted successfully!");
    } catch (error: any) {
      addLogMessage("Error uploading the file.");
      setError(`An error occurred - ${error}`);
      setLoading(false);
    }
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Upload Experimental Data</h1>

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

      {/* Display error messages */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Display status log */}
      <div className="mt-6 p-4 bg-gray-100 text-gray-700 rounded max-h-64 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Status</h2>
        <div>
          {logMessages.map((message, index) => (
            <p key={index} className="text-sm mb-1">
              {message}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadFile;
