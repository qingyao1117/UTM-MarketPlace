"use client";

import { useState } from "react";

interface PrintingPlatformProps {
  router: any;
}

export default function PrintingPlatform({ router }: PrintingPlatformProps) {
  const [file, setFile] = useState<File | null>(null);
  const [colorMode, setColorMode] = useState<"color" | "bw">("bw");
  const [doubleSided, setDoubleSided] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const sizeMB = selectedFile.size / (1024 * 1024);
      const pages = Math.ceil(sizeMB * 15); // Rough estimate: 15 pages per MB
      setPageCount(pages);
      setEstimatedCost(pages * (colorMode === "color" ? 0.25 : 0.10) * (doubleSided ? 1 : 0.8));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload a file first");
      return;
    }
    alert("Printing order submitted! Backend needs to be deployed for actual processing.");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary-600">Printing Service Platform</h1>
      <p className="text-gray-600 mb-8">Print documents online</p>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2">Upload Document</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 cursor-pointer transition-colors">
              <input 
                type="file" 
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.png"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600">
                    {file ? (
                      <span className="text-green-600 font-semibold">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                    ) : (
                      <span>Click to upload or drag and drop</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Supported: PDF, DOC, DOCX, JPG, PNG (Max 50MB)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Color Mode */}
          <div>
            <label className="block text-sm font-semibold mb-3">Color Mode</label>
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer ${colorMode === "bw" ? "border-primary-600 bg-primary-50" : "border-gray-300"}`}>
                <input type="radio" name="colorMode" value="bw" checked={colorMode === "bw"} onChange={() => setColorMode("bw")} />
                <span>Black & White</span>
              </label>
              <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer ${colorMode === "color" ? "border-primary-600 bg-primary-50" : "border-gray-300"}`}>
                <input type="radio" name="colorMode" value="color" checked={colorMode === "color"} onChange={() => setColorMode("color")} />
                <span>Color</span>
              </label>
            </div>
          </div>

          {/* Double-sided */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <label className="font-semibold">Double-sided Printing</label>
              <p className="text-sm text-gray-500">Save paper with duplex printing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={doubleSided} onChange={(e) => setDoubleSided(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Estimated Cost */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-2">
              Pages: <strong className="text-blue-900">{pageCount}</strong> | 
              Mode: <strong className="text-blue-900">{colorMode === "color" ? "Color" : "B&W"}</strong> | 
              Duplex: <strong className="text-blue-900">{doubleSided ? "Yes" : "No"}</strong>
            </p>
            <p className="text-sm text-blue-600">Estimated Cost: <strong className="text-2xl text-primary-600">RM {estimatedCost.toFixed(2)}</strong></p>
            <p className="text-xs text-blue-500 mt-1">
              B&W: RM 0.10/page | Color: RM 0.25/page | Duplex: 20% discount
            </p>
          </div>

          {/* Submit Button */}
          <button type="submit" className="w-full bg-primary-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-primary-700 transition-colors disabled:opacity-50" disabled={!file}>
            Submit Printing Order
          </button>
        </form>
      </div>
    </div>
  );
}
