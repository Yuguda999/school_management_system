import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const predefinedColors = [
    '#0ea5e9', // sky-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
    '#f43f5e', // rose-500
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#10b981', // emerald-500
    '#06b6d4', // cyan-500
  ];

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input flex-1"
          placeholder="#000000"
        />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="grid grid-cols-6 gap-2">
            {predefinedColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-8 rounded border border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
