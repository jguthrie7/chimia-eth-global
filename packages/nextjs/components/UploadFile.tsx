// components/UploadFile.tsx
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
  const { writeContractAsync } = useScaffoldWriteContract("Experiments");
  const { address } = useAccount();

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

      console.log(parsedFileContent);
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

      for (const [key, value] of Object.entries(parsedFileContent.nft_metadata)) {
        if (key === "image") continue;
        nftMetadata.attributes.push({
          trait_type: key,
          value: value as string,
        });
        if (blobId) {
          nftMetadata.attributes.push({
            trait_type: "Full Results",
            value: blobId,
          });
        }
      }

      // Make the PUT request to upload to Walrus
      console.log("Uploading file to Walrus...");
      const response = await axios.put<UploadResponse>(`${process.env.NEXT_PUBLIC_PUBLISHER}/v1/store`, fileContent, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Uploading NFT file to Walrus...");
      const responseNFT = await axios.put<UploadResponse>(
        `${process.env.NEXT_PUBLIC_PUBLISHER}/v1/store`,
        nftMetadata,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      console.log("done uploading NFT file to Walrus...");
      console.log("NFT Blob ID:", responseNFT.data);

      setUploadResult(response.data);

      let tempBlobId = "";
      let tempNftBlobId = "";

      if ("newlyCreated" in response.data) {
        console.log("File uploaded successfully!");
        console.log("blobId:", response.data.newlyCreated.blobObject.blobId);
        tempBlobId = response.data.newlyCreated.blobObject.blobId;
      } else if ("alreadyCertified" in response.data) {
        console.log("Data has already been uploaded.");
        console.log("blobId:", response.data.alreadyCertified.blobId);
        tempBlobId = response.data.alreadyCertified.blobId;
        setError("Data has already been uploaded.");
      }
      if ("newlyCreated" in responseNFT.data) {
        tempNftBlobId = responseNFT.data.newlyCreated.blobObject.blobId;
        console.log("NFT Blob ID:", tempNftBlobId);
      } else if ("alreadyCertified" in responseNFT.data) {
        tempNftBlobId = responseNFT.data.alreadyCertified.blobId;
        console.log("NFT Blob ID:", tempNftBlobId);
        setError("Data has already been uploaded.");
      }
      setBlobId(tempBlobId);
      setNftBlobId(tempNftBlobId);
      setLoading(false);
      console.log("Minting NFT...");
      const tx = await writeContractAsync({
        functionName: "mint",
        args: [address, "https://aggregator.walrus-testnet.walrus.space/v1/" + tempNftBlobId],
      });
      console.log("tx:", tx);
      console.log("NFT minted!");
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
          <pre className="bg-gray-100 p-3 rounded">{blobId}</pre>
          <pre className="bg-gray-100 p-3 rounded">{nftBlobId}</pre>
        </div>
      )}
    </div>
  );
};

export default UploadFile;
