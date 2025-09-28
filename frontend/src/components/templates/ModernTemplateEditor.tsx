import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  EyeIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PhotoIcon,
  PaintBrushIcon,
  CursorArrowRaysIcon,
  Squares2X2Icon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  BeakerIcon,
  SwatchIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { ReportCardTemplate } from '../../services/templateService';

interface TemplateElement {
  id: string;
  type: 'text' | 'table' | 'image' | 'line' | 'school_header' | 'student_info' | 'grade_table' | 'signature' | 'watermark';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700' | '800';
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  padding: number;
  borderRadius: number;
  opacity: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  properties?: Record<string, any>;
}

interface ModernTemplateEditorProps {
  template: ReportCardTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: any) => void;
}

const CANVAS_WIDTH = 794; // A4 width in pixels at 96 DPI
const CANVAS_HEIGHT = 1123; // A4 height in pixels at 96 DPI

const ELEMENT_TEMPLATES = [
  {
    type: 'school_header',
    icon: DocumentTextIcon,
    label: 'School Header',
    description: 'School name, logo, and address',
    defaultProps: {
      content: 'SCHOOL NAME\nAddress Line 1\nAddress Line 2',
      width: 300,
      height: 80,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#1f2937',
    }
  },
  {
    type: 'student_info',
    icon: CursorArrowRaysIcon,
    label: 'Student Info',
    description: 'Student name, class, and details',
    defaultProps: {
      content: 'Student: [Student Name]\nClass: [Class Name]\nRoll No: [Roll Number]',
      width: 250,
      height: 60,
      fontSize: 14,
      textAlign: 'left',
    }
  },
  {
    type: 'grade_table',
    icon: TableCellsIcon,
    label: 'Grades Table',
    description: 'Subject grades and scores',
    defaultProps: {
      content: 'Grades Table',
      width: 500,
      height: 200,
      borderWidth: 1,
      borderColor: '#d1d5db',
    }
  },
  {
    type: 'text',
    icon: DocumentTextIcon,
    label: 'Text Block',
    description: 'Custom text content',
    defaultProps: {
      content: 'Text Block',
      width: 200,
      height: 40,
      fontSize: 14,
    }
  },
  {
    type: 'signature',
    icon: PaintBrushIcon,
    label: 'Signature',
    description: 'Teacher or principal signature',
    defaultProps: {
      content: 'Signature: ___________________',
      width: 200,
      height: 50,
      fontSize: 12,
    }
  },
  {
    type: 'image',
    icon: PhotoIcon,
    label: 'Image',
    description: 'Logo or decorative image',
    defaultProps: {
      content: 'Image Placeholder',
      width: 100,
      height: 100,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: '#9ca3af',
    }
  },
  {
    type: 'line',
    icon: Squares2X2Icon,
    label: 'Divider Line',
    description: 'Decorative or separator line',
    defaultProps: {
      content: '',
      width: 300,
      height: 2,
      backgroundColor: '#6b7280',
    }
  },
  {
    type: 'watermark',
    icon: BeakerIcon,
    label: 'Watermark',
    description: 'Background watermark',
    defaultProps: {
      content: 'DRAFT',
      width: 400,
      height: 400,
      fontSize: 72,
      fontWeight: 'bold',
      color: '#f3f4f6',
      rotation: -45,
      opacity: 0.1,
      zIndex: -1,
    }
  },
];

const FONTS = [
  'Arial', 'Times New Roman', 'Georgia', 'Helvetica', 'Verdana', 
  'Tahoma', 'Trebuchet MS', 'Courier New', 'Impact', 'Comic Sans MS'
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

const ModernTemplateEditor: React.FC<ModernTemplateEditorProps> = ({
  template,
  isOpen,
  onClose,
  onSave,
}) => {
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(0.7);
  const [showGrid, setShowGrid] = useState(true);
  const [templateName, setTemplateName] = useState(template?.name || 'Untitled Template');
  const [previewMode, setPreviewMode] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'elements' | 'properties' | 'layers'>('elements');

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (template) {
      // Load template data
      setTemplateName(template.name);
      // Initialize with some default elements if template is new
      if (!template.id || elements.length === 0) {
        setElements([
          {
            id: '1',
            type: 'school_header',
            content: 'REPORT CARD\nAcademic Year 2024-2025',
            x: 50,
            y: 30,
            width: 694,
            height: 80,
            fontSize: 24,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontStyle: 'normal',
            color: '#1f2937',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            borderStyle: 'solid',
            textAlign: 'center',
            padding: 10,
            borderRadius: 0,
            opacity: 1,
            rotation: 0,
            zIndex: 1,
            locked: false,
            visible: true,
          },
          {
            id: '2',
            type: 'student_info',
            content: 'Student Name: [Student Name]\nClass: [Class Name]\nRoll Number: [Roll Number]',
            x: 50,
            y: 130,
            width: 300,
            height: 80,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '#374151',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            borderStyle: 'solid',
            textAlign: 'left',
            padding: 10,
            borderRadius: 0,
            opacity: 1,
            rotation: 0,
            zIndex: 2,
            locked: false,
            visible: true,
          },
        ]);
      }
    }
  }, [template]);

  const addElement = useCallback((elementType: string) => {
    const template = ELEMENT_TEMPLATES.find(t => t.type === elementType);
    if (!template) return;

    const newElement: TemplateElement = {
      id: Date.now().toString(),
      type: elementType as any,
      x: 50 + (elements.length * 20),
      y: 50 + (elements.length * 20),
      fontSize: 14,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      backgroundColor: 'transparent',
      borderColor: '#d1d5db',
      borderWidth: 0,
      borderStyle: 'solid',
      textAlign: 'left',
      padding: 10,
      borderRadius: 0,
      opacity: 1,
      rotation: 0,
      zIndex: elements.length + 1,
      locked: false,
      visible: true,
      ...template.defaultProps,
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    setSidebarTab('properties');
  }, [elements.length]);

  const updateElement = useCallback((id: string, updates: Partial<TemplateElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  }, [selectedElement]);

  const duplicateElement = useCallback((id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;

    const newElement: TemplateElement = {
      ...element,
      id: Date.now().toString(),
      x: element.x + 20,
      y: element.y + 20,
      zIndex: Math.max(...elements.map(el => el.zIndex)) + 1,
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, [elements]);

  const moveElement = useCallback((id: string, direction: 'up' | 'down') => {
    setElements(prev => {
      const newElements = [...prev];
      const index = newElements.findIndex(el => el.id === id);
      if (index === -1) return prev;

      if (direction === 'up' && index > 0) {
        [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
      } else if (direction === 'down' && index < newElements.length - 1) {
        [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
      }

      return newElements;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;

    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: (e.clientX - rect.left) / canvasScale - element.x,
        y: (e.clientY - rect.top) / canvasScale - element.y,
      });
    }
  }, [elements, canvasScale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.max(0, Math.min(CANVAS_WIDTH - 50, (e.clientX - rect.left) / canvasScale - dragOffset.x));
    const y = Math.max(0, Math.min(CANVAS_HEIGHT - 50, (e.clientY - rect.top) / canvasScale - dragOffset.y));

    updateElement(selectedElement, { x, y });
  }, [isDragging, selectedElement, dragOffset, canvasScale, updateElement]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElement(null);
    }
  }, []);

  const handleSave = useCallback(() => {
    const templateData = {
      id: template?.id,
      name: templateName,
      elements: elements,
      settings: {
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        paperSize: 'A4',
        orientation: 'portrait',
      }
    };
    onSave(templateData);
  }, [template, templateName, elements, onSave]);

  const selectedElementData = selectedElement ? elements.find(el => el.id === selectedElement) : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 dark:bg-gray-950 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <SwatchIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 p-0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Template Editor</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode(false)}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                !previewMode ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                previewMode ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Preview
            </button>
          </div>

          <div className="border-l border-gray-200 dark:border-gray-700 pl-3 flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Template
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!previewMode && (
          <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Sidebar Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-1">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {[
                  { id: 'elements', label: 'Elements', icon: Squares2X2Icon },
                  { id: 'properties', label: 'Properties', icon: AdjustmentsHorizontalIcon },
                  { id: 'layers', label: 'Layers', icon: BoltIcon },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSidebarTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center px-3 py-2 text-sm rounded-md transition-all ${
                      sidebarTab === tab.id
                        ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {sidebarTab === 'elements' && (
                <ElementsPanel onAddElement={addElement} />
              )}
              {sidebarTab === 'properties' && (
                <PropertiesPanel
                  element={selectedElementData}
                  onUpdateElement={updateElement}
                />
              )}
              {sidebarTab === 'layers' && (
                <LayersPanel
                  elements={elements}
                  selectedElement={selectedElement}
                  onSelectElement={setSelectedElement}
                  onDeleteElement={deleteElement}
                  onDuplicateElement={duplicateElement}
                  onMoveElement={moveElement}
                  onUpdateElement={updateElement}
                />
              )}
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 flex flex-col">
          {/* Canvas Controls */}
          {!previewMode && (
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Zoom:</label>
                  <select
                    value={canvasScale}
                    onChange={(e) => setCanvasScale(Number(e.target.value))}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={0.5}>50%</option>
                    <option value={0.7}>70%</option>
                    <option value={1}>100%</option>
                    <option value={1.25}>125%</option>
                    <option value={1.5}>150%</option>
                  </select>
                </div>
                <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span>Show Grid</span>
                </label>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                A4 • {CANVAS_WIDTH} × {CANVAS_HEIGHT}px
              </div>
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 overflow-auto p-8">
            <div className="flex justify-center">
              <div
                ref={canvasRef}
                className="bg-white shadow-lg relative"
                style={{
                  width: CANVAS_WIDTH * canvasScale,
                  height: CANVAS_HEIGHT * canvasScale,
                  transform: `scale(${canvasScale})`,
                  transformOrigin: 'top left',
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleCanvasClick}
              >
                {/* Grid */}
                {showGrid && !previewMode && (
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                        linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px',
                    }}
                  />
                )}

                {/* Elements */}
                {elements
                  .filter(el => el.visible)
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map(element => (
                    <ElementRenderer
                      key={element.id}
                      element={element}
                      isSelected={selectedElement === element.id}
                      isPreview={previewMode}
                      onMouseDown={(e) => handleMouseDown(e, element.id)}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Elements Panel Component
interface ElementsPanelProps {
  onAddElement: (type: string) => void;
}

const ElementsPanel: React.FC<ElementsPanelProps> = ({ onAddElement }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Add Elements</h3>
        <div className="grid grid-cols-2 gap-3">
          {ELEMENT_TEMPLATES.map(template => (
            <button
              key={template.type}
              onClick={() => onAddElement(template.type)}
              className="group p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
            >
              <template.icon className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2" />
              <div className="text-sm font-medium text-gray-900 dark:text-white">{template.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Properties Panel Component
interface PropertiesPanelProps {
  element: TemplateElement | null;
  onUpdateElement: (id: string, updates: Partial<TemplateElement>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ element, onUpdateElement }) => {
  if (!element) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <AdjustmentsHorizontalIcon className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p>Select an element to edit its properties</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Properties</h3>
        
        {/* Content */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
            <textarea
              value={element.content}
              onChange={(e) => onUpdateElement(element.id, { content: e.target.value })}
              rows={3}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Position & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">X</label>
              <input
                type="number"
                value={Math.round(element.x)}
                onChange={(e) => onUpdateElement(element.id, { x: Number(e.target.value) })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(element.y)}
                onChange={(e) => onUpdateElement(element.id, { y: Number(e.target.value) })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Width</label>
              <input
                type="number"
                value={Math.round(element.width)}
                onChange={(e) => onUpdateElement(element.id, { width: Number(e.target.value) })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height</label>
              <input
                type="number"
                value={Math.round(element.height)}
                onChange={(e) => onUpdateElement(element.id, { height: Number(e.target.value) })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Font Family</label>
              <select
                value={element.fontFamily}
                onChange={(e) => onUpdateElement(element.id, { fontFamily: e.target.value })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {FONTS.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                <select
                  value={element.fontSize}
                  onChange={(e) => onUpdateElement(element.id, { fontSize: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                >
                  {FONT_SIZES.map(size => (
                    <option key={size} value={size}>{size}px</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                <select
                  value={element.fontWeight}
                  onChange={(e) => onUpdateElement(element.id, { fontWeight: e.target.value as any })}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="300">Light</option>
                  <option value="500">Medium</option>
                  <option value="600">Semibold</option>
                  <option value="700">Bold</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Align</label>
              <select
                value={element.textAlign}
                onChange={(e) => onUpdateElement(element.id, { textAlign: e.target.value as any })}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={element.color}
                  onChange={(e) => onUpdateElement(element.id, { color: e.target.value })}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={element.color}
                  onChange={(e) => onUpdateElement(element.id, { color: e.target.value })}
                  className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={element.backgroundColor === 'transparent' ? '#ffffff' : element.backgroundColor}
                  onChange={(e) => onUpdateElement(element.id, { backgroundColor: e.target.value })}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={element.backgroundColor}
                  onChange={(e) => onUpdateElement(element.id, { backgroundColor: e.target.value })}
                  placeholder="transparent"
                  className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Border */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Border Width</label>
                <input
                  type="number"
                  min="0"
                  value={element.borderWidth}
                  onChange={(e) => onUpdateElement(element.id, { borderWidth: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Border Style</label>
                <select
                  value={element.borderStyle}
                  onChange={(e) => onUpdateElement(element.id, { borderStyle: e.target.value as any })}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={element.borderColor}
                  onChange={(e) => onUpdateElement(element.id, { borderColor: e.target.value })}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={element.borderColor}
                  onChange={(e) => onUpdateElement(element.id, { borderColor: e.target.value })}
                  className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Advanced */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={element.opacity}
                  onChange={(e) => onUpdateElement(element.id, { opacity: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">{Math.round(element.opacity * 100)}%</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rotation</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={element.rotation}
                  onChange={(e) => onUpdateElement(element.id, { rotation: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">{element.rotation}°</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Layers Panel Component
interface LayersPanelProps {
  elements: TemplateElement[];
  selectedElement: string | null;
  onSelectElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onMoveElement: (id: string, direction: 'up' | 'down') => void;
  onUpdateElement: (id: string, updates: Partial<TemplateElement>) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedElement,
  onSelectElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveElement,
  onUpdateElement,
}) => {
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Layers</h3>
      <div className="space-y-2">
        {sortedElements.map((element, index) => (
          <div
            key={element.id}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              selectedElement === element.id
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectElement(element.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateElement(element.id, { visible: !element.visible });
                  }}
                  className={`w-4 h-4 rounded border ${
                    element.visible ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}
                >
                  {element.visible && <EyeIcon className="w-3 h-3 text-white" />}
                </button>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {element.content.split('\n')[0].substring(0, 30) || element.type}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveElement(element.id, 'up');
                  }}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <ArrowUpIcon className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveElement(element.id, 'down');
                  }}
                  disabled={index === sortedElements.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <ArrowDownIcon className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateElement(element.id);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <DocumentDuplicateIcon className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteElement(element.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Element Renderer Component
interface ElementRendererProps {
  element: TemplateElement;
  isSelected: boolean;
  isPreview: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isSelected,
  isPreview,
  onMouseDown,
}) => {
  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    fontSize: element.fontSize,
    fontFamily: element.fontFamily,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    color: element.color,
    backgroundColor: element.backgroundColor === 'transparent' ? 'transparent' : element.backgroundColor,
    border: element.borderWidth > 0 ? `${element.borderWidth}px ${element.borderStyle} ${element.borderColor}` : 'none',
    textAlign: element.textAlign,
    padding: element.padding,
    borderRadius: element.borderRadius,
    opacity: element.opacity,
    transform: `rotate(${element.rotation}deg)`,
    zIndex: element.zIndex,
    cursor: isPreview ? 'default' : 'move',
    userSelect: 'none',
    boxSizing: 'border-box',
    outline: isSelected && !isPreview ? '2px solid #3b82f6' : 'none',
    outlineOffset: isSelected && !isPreview ? '2px' : '0',
  };

  const renderContent = () => {
    switch (element.type) {
      case 'text':
      case 'school_header':
      case 'student_info':
      case 'signature':
      case 'watermark':
        return (
          <div className="w-full h-full flex items-center justify-center p-2 whitespace-pre-line">
            {element.content}
          </div>
        );
      
      case 'grade_table':
        return (
          <div className="w-full h-full p-2">
            <table className="w-full h-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-1 text-left">Subject</th>
                  <th className="border border-gray-300 p-1 text-center">Score</th>
                  <th className="border border-gray-300 p-1 text-center">Grade</th>
                  <th className="border border-gray-300 p-1 text-center">Remark</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-1">Mathematics</td>
                  <td className="border border-gray-300 p-1 text-center">85</td>
                  <td className="border border-gray-300 p-1 text-center">A</td>
                  <td className="border border-gray-300 p-1 text-center">Excellent</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1">English</td>
                  <td className="border border-gray-300 p-1 text-center">78</td>
                  <td className="border border-gray-300 p-1 text-center">B+</td>
                  <td className="border border-gray-300 p-1 text-center">Good</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1">Science</td>
                  <td className="border border-gray-300 p-1 text-center">92</td>
                  <td className="border border-gray-300 p-1 text-center">A+</td>
                  <td className="border border-gray-300 p-1 text-center">Outstanding</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      
      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300">
            <div className="text-center">
              <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
              <div className="text-xs text-gray-500">Image</div>
            </div>
          </div>
        );
      
      case 'line':
        return <div className="w-full h-full" />;
      
      default:
        return <div className="w-full h-full flex items-center justify-center text-gray-500">Unknown Element</div>;
    }
  };

  return (
    <div
      style={elementStyle}
      onMouseDown={onMouseDown}
      className={isSelected && !isPreview ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
    >
      {renderContent()}
    </div>
  );
};

export default ModernTemplateEditor;
