import React, { useState } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PaintBrushIcon,
  ChatBubbleLeftRightIcon as TextIcon,
  TableCellsIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

interface TemplateField {
  id: string;
  type: 'text' | 'table' | 'image' | 'line';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
}

interface ReportCardTemplateEditorProps {
  templateId?: string;
  onSave: (template: any) => void;
  onCancel: () => void;
}

const ReportCardTemplateEditor: React.FC<ReportCardTemplateEditorProps> = ({
  templateId,
  onSave,
  onCancel,
}) => {
  const [fields, setFields] = useState<TemplateField[]>([
    {
      id: '1',
      type: 'text',
      content: 'REPORT CARD',
      x: 50,
      y: 20,
      width: 200,
      height: 30,
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      textAlign: 'center',
      fontWeight: 'bold',
      fontStyle: 'normal',
    },
    {
      id: '2',
      type: 'text',
      content: 'Student Name: [Student Name]',
      x: 50,
      y: 80,
      width: 300,
      height: 20,
      fontSize: 14,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      textAlign: 'left',
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    {
      id: '3',
      type: 'table',
      content: 'Grades Table',
      x: 50,
      y: 120,
      width: 500,
      height: 200,
      fontSize: 12,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'transparent',
      borderColor: '#000000',
      borderWidth: 1,
      textAlign: 'left',
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
  ]);

  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showProperties, setShowProperties] = useState(false);

  const addField = (type: TemplateField['type']) => {
    const newField: TemplateField = {
      id: Date.now().toString(),
      type,
      content: type === 'text' ? 'New Text' : type === 'table' ? 'New Table' : 'New Image',
      x: 50,
      y: 50 + fields.length * 30,
      width: type === 'table' ? 400 : 200,
      height: type === 'table' ? 150 : 30,
      fontSize: 12,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'transparent',
      borderColor: '#000000',
      borderWidth: 1,
      textAlign: 'left',
      fontWeight: 'normal',
      fontStyle: 'normal',
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<TemplateField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
    if (selectedField === id) {
      setSelectedField(null);
      setShowProperties(false);
    }
  };

  const moveField = (id: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const field = fields.find(f => f.id === id);
    if (!field) return;

    const step = 10;
    const updates: Partial<TemplateField> = {};
    
    switch (direction) {
      case 'up':
        updates.y = Math.max(0, field.y - step);
        break;
      case 'down':
        updates.y = field.y + step;
        break;
      case 'left':
        updates.x = Math.max(0, field.x - step);
        break;
      case 'right':
        updates.x = field.x + step;
        break;
    }
    
    updateField(id, updates);
  };

  const renderField = (field: TemplateField) => {
    const isSelected = selectedField === field.id;
    
    const fieldStyle: React.CSSProperties = {
      position: 'absolute',
      left: field.x,
      top: field.y,
      width: field.width,
      height: field.height,
      fontSize: field.fontSize,
      fontFamily: field.fontFamily,
      color: field.color,
      backgroundColor: field.backgroundColor,
      borderColor: field.borderColor,
      borderWidth: field.borderWidth,
      borderStyle: 'solid',
      textAlign: field.textAlign,
      fontWeight: field.fontWeight,
      fontStyle: field.fontStyle,
      cursor: 'move',
      userSelect: 'none',
      zIndex: isSelected ? 10 : 1,
      outline: isSelected ? '2px solid #3B82F6' : 'none',
    };

    const handleFieldClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedField(field.id);
      setShowProperties(true);
    };

    const handleFieldDrag = (e: React.MouseEvent) => {
      if (!isSelected) return;
      
      const startX = e.clientX - field.x;
      const startY = e.clientY - field.y;
      
      const handleMouseMove = (e: MouseEvent) => {
        updateField(field.id, {
          x: Math.max(0, e.clientX - startX),
          y: Math.max(0, e.clientY - startY),
        });
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    return (
      <div
        key={field.id}
        style={fieldStyle}
        onClick={handleFieldClick}
        onMouseDown={handleFieldDrag}
        className="select-none"
      >
        {field.type === 'text' && (
          <div className="w-full h-full flex items-center px-2">
            {field.content}
          </div>
        )}
        {field.type === 'table' && (
          <div className="w-full h-full border border-gray-300 p-2">
            <div className="text-xs text-gray-500 mb-2">Grades Table</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-1">Subject</th>
                  <th className="text-center p-1">Score</th>
                  <th className="text-center p-1">Grade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1">Math</td>
                  <td className="text-center p-1">85</td>
                  <td className="text-center p-1">A</td>
                </tr>
                <tr>
                  <td className="p-1">English</td>
                  <td className="text-center p-1">78</td>
                  <td className="text-center p-1">B+</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {field.type === 'image' && (
          <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center">
            <PhotoIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        {field.type === 'line' && (
          <div className="w-full h-full flex items-center">
            <div className="w-full border-t border-gray-400"></div>
          </div>
        )}
      </div>
    );
  };

  const selectedFieldData = fields.find(f => f.id === selectedField);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Template Editor</h1>
          <span className="text-sm text-gray-500">Template ID: {templateId || 'New'}</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onSave({ id: templateId, fields })}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Save Template
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Toolbar */}
        <div className="w-64 bg-white shadow-sm border-r p-4">
          <h3 className="font-medium text-gray-900 mb-4">Add Elements</h3>
          <div className="space-y-2">
            <button
              onClick={() => addField('text')}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <TextIcon className="h-4 w-4 mr-2" />
              Add Text
            </button>
            <button
              onClick={() => addField('table')}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <TableCellsIcon className="h-4 w-4 mr-2" />
              Add Table
            </button>
            <button
              onClick={() => addField('image')}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <PhotoIcon className="h-4 w-4 mr-2" />
              Add Image
            </button>
            <button
              onClick={() => addField('line')}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <div className="h-4 w-4 mr-2 border-t border-gray-400"></div>
              Add Line
            </button>
          </div>

          {selectedFieldData && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-4">Position</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => moveField(selectedFieldData.id, 'up')}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  <ArrowUpIcon className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => moveField(selectedFieldData.id, 'down')}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  <ArrowDownIcon className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => moveField(selectedFieldData.id, 'left')}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  <ArrowLeftIcon className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => moveField(selectedFieldData.id, 'right')}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  <ArrowRightIcon className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 p-6">
          <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm', height: '297mm', position: 'relative' }}>
            {fields.map(renderField)}
          </div>
        </div>

        {/* Properties Panel */}
        {showProperties && selectedFieldData && (
          <div className="w-80 bg-white shadow-sm border-l p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Properties</h3>
              <button
                onClick={() => deleteField(selectedFieldData.id)}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <input
                  type="text"
                  value={selectedFieldData.content}
                  onChange={(e) => updateField(selectedFieldData.id, { content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">X</label>
                  <input
                    type="number"
                    value={selectedFieldData.x}
                    onChange={(e) => updateField(selectedFieldData.id, { x: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Y</label>
                  <input
                    type="number"
                    value={selectedFieldData.y}
                    onChange={(e) => updateField(selectedFieldData.id, { y: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                  <input
                    type="number"
                    value={selectedFieldData.width}
                    onChange={(e) => updateField(selectedFieldData.id, { width: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  <input
                    type="number"
                    value={selectedFieldData.height}
                    onChange={(e) => updateField(selectedFieldData.id, { height: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                <input
                  type="number"
                  value={selectedFieldData.fontSize}
                  onChange={(e) => updateField(selectedFieldData.id, { fontSize: parseInt(e.target.value) || 12 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                <input
                  type="color"
                  value={selectedFieldData.color}
                  onChange={(e) => updateField(selectedFieldData.id, { color: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <input
                  type="color"
                  value={selectedFieldData.backgroundColor}
                  onChange={(e) => updateField(selectedFieldData.id, { backgroundColor: e.target.value })}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text Align</label>
                <select
                  value={selectedFieldData.textAlign}
                  onChange={(e) => updateField(selectedFieldData.id, { textAlign: e.target.value as 'left' | 'center' | 'right' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCardTemplateEditor;