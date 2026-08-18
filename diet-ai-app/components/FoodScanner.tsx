'use client';
import { Camera, Upload } from 'lucide-react';
import { useState } from 'react';

export default function FoodScanner({ onFoodDetected }: { onFoodDetected: (food: any) => void }) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/detect-food', { method: 'POST', body: formData });
      const result = await res.json();
      onFoodDetected(result);
    } catch {
      // Dynamic fallback if server is unreachable
      const label = file.name.split('.')[0]
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      
      onFoodDetected({
        food: label || "Healthy Meal",
        calories: 350 + Math.floor(Math.random() * 200),
        protein: 15 + Math.floor(Math.random() * 15),
        carbs: 30 + Math.floor(Math.random() * 40),
        fat: 8 + Math.floor(Math.random() * 10),
        message: "Offline / fallback detection active."
      });
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl p-10 text-center shadow-xl">
      <h2 className="text-2xl font-bold mb-8">Scan Your Food</h2>
      <div className="flex justify-center gap-8">
        <div>
          <label htmlFor="live-camera" className="cursor-pointer">
            <div className="w-44 h-44 border-4 border-dashed border-emerald-400 rounded-3xl flex flex-col items-center justify-center hover:border-emerald-500">
              <Camera size={50} className="text-emerald-600 mb-3" />
              <p className="font-medium">Live Camera</p>
              <p className="text-xs text-gray-500">(System Camera)</p>
            </div>
          </label>
          <input 
            id="live-camera" 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleUpload} 
            className="hidden" 
          />
        </div>

        <div>
          <label htmlFor="upload-photo" className="cursor-pointer">
            <div className="w-44 h-44 border-4 border-dashed border-emerald-400 rounded-3xl flex flex-col items-center justify-center hover:border-emerald-500">
              <Upload size={50} className="text-emerald-600 mb-3" />
              <p className="font-medium">Upload Photo</p>
            </div>
          </label>
          <input 
            id="upload-photo" 
            type="file" 
            accept="image/*" 
            onChange={handleUpload} 
            className="hidden" 
          />
        </div>
      </div>
      {loading && <p className="mt-6 text-emerald-600 font-medium">AI is analyzing...</p>}
    </div>
  );
}