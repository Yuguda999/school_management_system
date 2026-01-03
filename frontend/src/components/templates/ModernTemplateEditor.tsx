import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  BeakerIcon,
  SwatchIcon,
  BoltIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ListBulletIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@heroicons/react/24/outline';
import { ReportCardTemplate } from '../../services/templateService';
import { ReportCardRenderer, TemplateElement } from './ReportCardRenderer';
import gradeTemplateService from '../../services/gradeTemplateService';
import schoolService from '../../services/schoolService';
import { GradeTemplate } from '../../types';

interface ModernTemplateEditorProps {
  template: ReportCardTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: any) => void;
}

const PAPER_SIZES = {
  'A4': { width: 794, height: 1123 },
  'Letter': { width: 816, height: 1056 },
  'Legal': { width: 816, height: 1344 },
};


const ELEMENT_TEMPLATES = [
  {
    type: 'school_logo',
    icon: PhotoIcon,
    label: 'School Logo',
    description: 'Actual school logo',
    defaultProps: {
      content: '',
      width: 100,
      height: 100,
      borderWidth: 0,
    }
  },
  {
    type: 'school_name',
    icon: DocumentTextIcon,
    label: 'School Name',
    description: 'School name placeholder',
    defaultProps: {
      content: '[School Name]',
      width: 694,
      height: 60,
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#1f2937',
    }
  },
  {
    type: 'school_address',
    icon: DocumentTextIcon,
    label: 'School Address',
    description: 'School address placeholder',
    defaultProps: {
      content: '[School Address]',
      width: 694,
      height: 40,
      fontSize: 14,
      fontWeight: 'normal',
      textAlign: 'center',
      color: '#4b5563',
    }
  },
  {
    type: 'school_motto',
    icon: DocumentTextIcon,
    label: 'School Motto',
    description: 'School motto placeholder',
    defaultProps: {
      content: '[Motto]',
      width: 694,
      height: 40,
      fontSize: 12,
      fontWeight: 'normal',
      fontStyle: 'italic',
      textAlign: 'center',
      color: '#6b7280',
    }
  },
  {
    type: 'student_name',
    icon: CursorArrowRaysIcon,
    label: 'Student Name',
    description: 'Student name placeholder',
    defaultProps: {
      content: 'Student: [Student Name]',
      width: 300,
      height: 40,
      fontSize: 14,
      textAlign: 'left',
    }
  },
  {
    type: 'class_name',
    icon: CursorArrowRaysIcon,
    label: 'Class Name',
    description: 'Class name placeholder',
    defaultProps: {
      content: 'Class: [Class Name]',
      width: 300,
      height: 40,
      fontSize: 14,
      textAlign: 'left',
    }
  },
  {
    type: 'roll_number',
    icon: CursorArrowRaysIcon,
    label: 'Roll Number',
    description: 'Roll number placeholder',
    defaultProps: {
      content: 'Roll No: [Roll Number]',
      width: 300,
      height: 40,
      fontSize: 14,
      textAlign: 'left',
    }
  },
  {
    type: 'academic_year',
    icon: CursorArrowRaysIcon,
    label: 'Academic Year',
    description: 'Academic year placeholder',
    defaultProps: {
      content: 'Session: [Academic Year]',
      width: 300,
      height: 40,
      fontSize: 14,
      textAlign: 'left',
    }
  },
  {
    type: 'term',
    icon: CursorArrowRaysIcon,
    label: 'Term',
    description: 'Term placeholder',
    defaultProps: {
      content: 'Term: [Term]',
      width: 300,
      height: 40,
      fontSize: 14,
      textAlign: 'left',
    }
  },
  {
    type: 'total_marks',
    icon: TableCellsIcon,
    label: 'Total Marks',
    description: 'Total marks summary',
    defaultProps: {
      content: 'Total Marks: [Total Score] of [Max Score]',
      width: 300,
      height: 40,
      fontSize: 14,
      textAlign: 'left',
      fontWeight: 'bold',
    }
  },
  {
    type: 'percentage',
    icon: TableCellsIcon,
    label: 'Percentage',
    description: 'Overall percentage',
    defaultProps: {
      content: 'Percentage: [Percentage]%',
      width: 300,
      height: 40,
      fontSize: 14,
      textAlign: 'left',
      fontWeight: 'bold',
    }
  },
  {
    type: 'position',
    icon: TableCellsIcon,
    label: 'Position',
    description: 'Class position',
    defaultProps: {
      content: 'Position: [Position]',
      width: 300,
      height: 40,
      fontSize: 14,
      textAlign: 'left',
      fontWeight: 'bold',
    }
  },
  {
    type: 'result',
    icon: TableCellsIcon,
    label: 'Result',
    description: 'Final result status',
    defaultProps: {
      content: 'Result: [Result]',
      width: 300,
      height: 40,
      fontSize: 14,
      textAlign: 'center',
      fontWeight: 'bold',
    }
  },
  {
    type: 'attendance_summary',
    icon: CalendarDaysIcon,
    label: 'Attendance Summary',
    description: 'Attendance summary text',
    defaultProps: {
      content: 'Attendance: [Present] of [Total Days]',
      width: 300,
      height: 40,
      fontSize: 14,
      textAlign: 'left',
    }
  },
  {
    type: 'next_term_date',
    icon: CalendarDaysIcon,
    label: 'Next Term Date',
    description: 'School reopening date',
    defaultProps: {
      content: 'School Reopens: [Next Term Date]',
      width: 300,
      height: 40,
      fontSize: 14,
      textAlign: 'center',
      backgroundColor: '#f59e0b',
      color: '#ffffff',
      fontWeight: 'bold',
    }
  },
  {
    type: 'grade_table',
    icon: TableCellsIcon,
    label: 'Grades Table',
    description: 'Subject grades and scores',
    defaultProps: {
      content: 'Grades Table',
      width: 694,
      height: 300,
      borderWidth: 1,
      borderColor: '#d1d5db',
      properties: {
        showRemarks: true,
        striped: true,
        headerBackgroundColor: '#f3f4f6',
        headerTextColor: '#374151',
      }
    }
  },
  {
    type: 'attendance_table',
    icon: CalendarDaysIcon,
    label: 'Attendance',
    description: 'Monthly attendance summary',
    defaultProps: {
      content: 'Attendance Table',
      width: 694,
      height: 200,
      borderWidth: 1,
      borderColor: '#d1d5db',
      properties: {
        striped: true,
        headerBackgroundColor: '#f3f4f6',
        headerTextColor: '#374151',
      }
    }
  },
  {
    type: 'behavior_table',
    icon: UserGroupIcon,
    label: 'Behavior',
    description: 'Behavioral traits assessment',
    defaultProps: {
      content: 'Behavior Table',
      width: 694,
      height: 150,
      borderWidth: 1,
      borderColor: '#d1d5db',
      properties: {
        striped: true,
        headerBackgroundColor: '#f3f4f6',
        headerTextColor: '#374151',
      }
    }
  },
  {
    type: 'grading_scale',
    icon: ListBulletIcon,
    label: 'Grading Scale',
    description: 'Reference for grade ranges',
    defaultProps: {
      content: 'Grading Scale',
      width: 200,
      height: 150,
      borderWidth: 1,
      borderColor: '#d1d5db',
      fontSize: 10,
      properties: {
        compact: true,
      }
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
      borderWidth: 0,
    }
  },
  {
    type: 'line',
    icon: Squares2X2Icon,
    label: 'Horizontal Line',
    description: 'Horizontal divider line',
    defaultProps: {
      content: '',
      width: 300,
      height: 1,
      backgroundColor: '#6b7280',
    }
  },
  {
    type: 'vertical_line',
    icon: Squares2X2Icon,
    label: 'Vertical Line',
    description: 'Vertical divider line',
    defaultProps: {
      content: '',
      width: 1,
      height: 100,
      backgroundColor: '#6b7280',
    }
  },
  {
    type: 'rectangle',
    icon: Squares2X2Icon,
    label: 'Rectangle',
    description: 'Rectangle shape',
    defaultProps: {
      content: '',
      width: 150,
      height: 100,
      backgroundColor: '#3b82f6',
      borderWidth: 0,
      borderColor: '#1e40af',
    }
  },
  {
    type: 'rounded_rectangle',
    icon: Squares2X2Icon,
    label: 'Rounded Box',
    description: 'Rectangle with rounded corners',
    defaultProps: {
      content: '',
      width: 150,
      height: 100,
      backgroundColor: '#10b981',
      borderRadius: 12,
      borderWidth: 0,
      borderColor: '#047857',
    }
  },
  {
    type: 'circle',
    icon: Squares2X2Icon,
    label: 'Circle',
    description: 'Circle or oval shape',
    defaultProps: {
      content: '',
      width: 100,
      height: 100,
      backgroundColor: '#f59e0b',
      borderRadius: 9999,
      borderWidth: 0,
      borderColor: '#d97706',
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
      zIndex: 0,
    }
  },
];

const FONTS = [
  // Classic System Fonts
  'Arial', 'Times New Roman', 'Georgia', 'Helvetica', 'Verdana',
  'Tahoma', 'Trebuchet MS', 'Courier New', 'Garamond', 'Palatino',
  // Modern Sans-Serif
  'Montserrat', 'Poppins', 'Raleway', 'Open Sans', 'Lato',
  'Roboto', 'Nunito', 'Quicksand', 'Inter', 'Outfit',
  // Elegant Serif
  'Playfair Display', 'Merriweather', 'Lora', 'Cormorant Garamond', 'Libre Baskerville',
  'Crimson Text', 'EB Garamond', 'Source Serif Pro', 'PT Serif', 'Bitter',
  // Stylish Display
  'Bebas Neue', 'Oswald', 'Anton', 'Josefin Sans', 'Abril Fatface',
  'Archivo Black', 'Barlow Condensed', 'Fjalla One', 'Righteous', 'Pacifico',
  // Script & Decorative
  'Dancing Script', 'Great Vibes', 'Sacramento', 'Satisfy', 'Lobster',
  'Caveat', 'Kaushan Script', 'Amatic SC', 'Courgette', 'Shadows Into Light',
  // Professional
  'Work Sans', 'Source Sans Pro', 'Fira Sans', 'Karla', 'Mulish',
  'Rubik', 'Manrope', 'DM Sans', 'Plus Jakarta Sans', 'Urbanist',
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
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialResizeState, setInitialResizeState] = useState<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startXPos: number;
    startYPos: number;
  } | null>(null);
  const [canvasScale, setCanvasScale] = useState(0.7);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [templateName, setTemplateName] = useState(template?.name || 'Untitled Template');
  const [previewMode, setPreviewMode] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'elements' | 'properties' | 'layers'>('elements');
  const [gradeTemplate, setGradeTemplate] = useState<GradeTemplate | null>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Paper settings
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');

  const canvasWidth = orientation === 'portrait' ? PAPER_SIZES[paperSize].width : PAPER_SIZES[paperSize].height;
  const canvasHeight = orientation === 'portrait' ? PAPER_SIZES[paperSize].height : PAPER_SIZES[paperSize].width;


  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      // Always load elements from the template if they exist
      if (template.elements && template.elements.length > 0) {
        // Deep copy to avoid reference issues
        setElements(JSON.parse(JSON.stringify(template.elements)));
      } else {
        // Default elements if template is empty
        setElements([
          {
            id: '1',
            type: 'school_logo',
            content: '',
            x: 50,
            y: 30,
            width: 80,
            height: 80,
            fontSize: 14,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '#000000',
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            borderStyle: 'solid',
            textAlign: 'left',
            padding: 0,
            borderRadius: 0,
            opacity: 1,
            rotation: 0,
            zIndex: 2,
            locked: false,
            visible: true,
          },
          {
            id: '2',
            type: 'school_name',
            content: '[School Name]',
            x: 140,
            y: 30,
            width: 600,
            height: 60,
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
            id: '3',
            type: 'student_info',
            content: 'Student Name: [Student Name]\nClass: [Class Name]\nRoll Number: [Roll Number]',
            x: 50,
            y: 160,
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

      // Load paper settings if available
      // Load paper settings from template root properties
      if (template.paper_size) setPaperSize(template.paper_size as any);
      if (template.orientation) setOrientation(template.orientation as any);
      if (template.background_color) setBackgroundColor(template.background_color);
    }
  }, [template]);

  // Fetch default grade template
  useEffect(() => {
    const fetchGradeTemplate = async () => {
      try {
        const templates = await gradeTemplateService.getGradeTemplates();
        const defaultTemplate = templates.find(t => t.is_default) || templates[0];
        if (defaultTemplate) {
          setGradeTemplate(defaultTemplate);
        }
      } catch (error) {
        console.error('Failed to load grade template:', error);
      }
    };

    if (isOpen) {
      fetchGradeTemplate();
    }
  }, [isOpen]);

  // Fetch school data
  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const school = await schoolService.getCurrentSchool();
        setSchoolData(school);
      } catch (error) {
        console.error('Failed to load school data:', error);
      }
    };

    if (isOpen) {
      fetchSchoolData();
    }
  }, [isOpen]);

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
      fontWeight: (template.defaultProps.fontWeight || 'normal') as any,
      fontStyle: 'normal',
      color: '#000000',
      backgroundColor: 'transparent',
      borderColor: '#d1d5db',
      borderWidth: 0,
      borderStyle: 'solid',
      textAlign: (template.defaultProps.textAlign || 'left') as any,
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
      // Sort elements by z-index descending (visual order)
      const sorted = [...prev].sort((a, b) => b.zIndex - a.zIndex);
      const currentIndex = sorted.findIndex(el => el.id === id);

      if (currentIndex === -1) return prev;

      let targetIndex = -1;
      // Up means 'bring forward', so move to lower index in descending list
      if (direction === 'up') targetIndex = currentIndex - 1;
      // Down means 'send backward', so move to higher index in descending list
      if (direction === 'down') targetIndex = currentIndex + 1;

      // Check bounds
      if (targetIndex < 0 || targetIndex >= sorted.length) return prev;

      const currentEl = sorted[currentIndex];
      const targetEl = sorted[targetIndex];

      // Swap z-indices in the state
      return prev.map(el => {
        if (el.id === currentEl.id) return { ...el, zIndex: targetEl.zIndex };
        if (el.id === targetEl.id) return { ...el, zIndex: currentEl.zIndex };
        return el;
      });
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

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    const element = elements.find(el => el.id === selectedElement);
    if (!element || !selectedElement) return;

    setIsResizing(true);
    setResizeDirection(direction);
    setInitialResizeState({
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width,
      startHeight: element.height,
      startXPos: element.x,
      startYPos: element.y,
    });
  }, [elements, selectedElement]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isResizing && initialResizeState && selectedElement && resizeDirection) {
      const deltaX = (e.clientX - initialResizeState.startX) / canvasScale;
      const deltaY = (e.clientY - initialResizeState.startY) / canvasScale;

      let newWidth = initialResizeState.startWidth;
      let newHeight = initialResizeState.startHeight;
      let newX = initialResizeState.startXPos;
      let newY = initialResizeState.startYPos;

      // Calculate new dimensions/position based on direction
      // Allow minimum of 1px for lines, 20px for other elements
      const minDimension = 1;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(minDimension, initialResizeState.startWidth + deltaX);
      }
      if (resizeDirection.includes('w')) {
        const potentialWidth = initialResizeState.startWidth - deltaX;
        if (potentialWidth >= minDimension) {
          newWidth = potentialWidth;
          newX = initialResizeState.startXPos + deltaX;
        }
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(minDimension, initialResizeState.startHeight + deltaY);
      }
      if (resizeDirection.includes('n')) {
        const potentialHeight = initialResizeState.startHeight - deltaY;
        if (potentialHeight >= minDimension) {
          newHeight = potentialHeight;
          newY = initialResizeState.startYPos + deltaY;
        }
      }

      // Snap to grid for resize
      if (snapToGrid) {
        newWidth = Math.round(newWidth / 10) * 10;
        newHeight = Math.round(newHeight / 10) * 10;
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;
      }

      updateElement(selectedElement, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      });
      return;
    }

    if (!isDragging || !selectedElement) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let x = (e.clientX - rect.left) / canvasScale - dragOffset.x;
    let y = (e.clientY - rect.top) / canvasScale - dragOffset.y;

    // Snap to grid (10px)
    if (snapToGrid) {
      x = Math.round(x / 10) * 10;
      y = Math.round(y / 10) * 10;
    }

    // Bounds check
    x = Math.max(0, Math.min(canvasWidth - 50, x));
    y = Math.max(0, Math.min(canvasHeight - 50, y));

    updateElement(selectedElement, { x, y });
  }, [isDragging, isResizing, selectedElement, dragOffset, canvasScale, updateElement, snapToGrid, canvasWidth, canvasHeight, initialResizeState, resizeDirection]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setInitialResizeState(null);
    setResizeDirection(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElement(null);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    const templateData = {
      id: template?.id,
      name: templateName,
      elements: elements,
      paper_size: paperSize,
      orientation: orientation,
      background_color: backgroundColor,
      // Keep settings for backward compatibility if needed, or remove if backend strictly rejects unknown fields
      settings: {
        canvasWidth,
        canvasHeight,
        paperSize,
        orientation,
        backgroundColor,
      }
    };

    try {
      await onSave(templateData);
    } finally {
      // Small delay to show the loading state for visual feedback
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [template, templateName, elements, onSave, canvasWidth, canvasHeight, paperSize, orientation, backgroundColor, isSaving]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected element with Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        const element = elements.find(el => el.id === selectedElement);
        // Only delete if not locked and not typing in an input
        if (element && !element.locked && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
          e.preventDefault();
          deleteElement(selectedElement);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, elements, deleteElement]);

  const selectedElementData = selectedElement ? (elements.find(el => el.id === selectedElement) || null) : null;

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-[100] flex flex-col h-screen w-screen overflow-hidden font-sans"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-14 flex items-center justify-between shrink-0 z-50 relative shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
              <SwatchIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="text-sm font-bold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder-gray-400 h-5"
                placeholder="Untitled Template"
              />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Report Card Template</span>
            </div>
          </div>
        </div>

        {/* Center Toolbar - Zoom & View Controls */}
        {!previewMode && (
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <div className="flex items-center px-2 space-x-2 border-r border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setCanvasScale(Math.max(0.3, canvasScale - 0.1))}
                className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors"
                title="Zoom Out"
              >
                <span className="text-lg leading-none">-</span>
              </button>
              <span className="text-xs font-medium w-10 text-center text-gray-900 dark:text-white select-none">
                {Math.round(canvasScale * 100)}%
              </span>
              <button
                onClick={() => setCanvasScale(Math.min(2, canvasScale + 0.1))}
                className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors"
                title="Zoom In"
              >
                <span className="text-lg leading-none">+</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 px-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1.5 rounded transition-colors ${showGrid ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="Toggle Grid"
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`p-1.5 rounded transition-colors ${snapToGrid ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="Snap to Grid"
              >
                <BoltIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode(false)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!previewMode
                ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Edit
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${previewMode
                ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Preview
            </button>
          </div>

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700"></div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors shadow-sm hover:shadow ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <DocumentTextIcon className="h-3.5 w-3.5 mr-1.5" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        {!previewMode && (
          <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            {/* Sidebar Tabs */}
            <div className="px-3 pt-3 pb-2">
              <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
                {[
                  { id: 'elements', label: 'Add', icon: PlusIcon },
                  { id: 'properties', label: 'Edit', icon: AdjustmentsHorizontalIcon },
                  { id: 'layers', label: 'Layers', icon: Squares2X2Icon },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSidebarTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-md transition-all ${sidebarTab === tab.id
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    <tab.icon className="h-3.5 w-3.5 mr-1.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar Content */}
            <div
              className="flex-1 overflow-y-auto p-4 custom-scrollbar"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {sidebarTab === 'elements' && (
                <ElementsPanel onAddElement={addElement} />
              )}
              {sidebarTab === 'properties' && (
                <PropertiesPanel
                  element={selectedElementData}
                  onUpdateElement={updateElement}
                  onDeleteElement={deleteElement}
                  onDuplicateElement={duplicateElement}
                  gradeTemplate={gradeTemplate}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  uploadedImages={uploadedImages}
                  onUploadImage={(imageDataUrl) => {
                    if (uploadedImages.length < 5) {
                      setUploadedImages(prev => [...prev, imageDataUrl]);
                    }
                  }}
                  onRemoveImage={(index) => {
                    setUploadedImages(prev => prev.filter((_, i) => i !== index));
                  }}
                />
              )}
              {sidebarTab === 'properties' && !selectedElement && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Page Settings</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paper Size</label>
                        <select
                          value={paperSize}
                          onChange={(e) => setPaperSize(e.target.value as any)}
                          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="A4">A4 (210 x 297 mm)</option>
                          <option value="Letter">Letter (8.5 x 11 in)</option>
                          <option value="Legal">Legal (8.5 x 14 in)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Orientation</label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
                          <button
                            onClick={() => setOrientation('portrait')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${orientation === 'portrait'
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                              }`}
                          >
                            Portrait
                          </button>
                          <button
                            onClick={() => setOrientation('landscape')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${orientation === 'landscape'
                              ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                              }`}
                          >
                            Landscape
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Background Color</label>
                        <div className="flex items-center space-x-2">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="color"
                              value={backgroundColor}
                              onChange={(e) => setBackgroundColor(e.target.value)}
                              className="h-9 w-9 p-0.5 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            />
                            <svg className="absolute h-5 w-5 pointer-events-none" viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <defs>
                                <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
                                  <stop offset="0%" stopColor="#ef4444" />
                                  <stop offset="33%" stopColor="#eab308" />
                                  <stop offset="66%" stopColor="#22c55e" />
                                  <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                              </defs>
                              <path d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.077-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.156 6.365a15.995 15.995 0 00-4.647 4.763m0 0c-.461.949-.929 1.886-1.42 2.801" stroke="url(#rainbow)" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
        <div className="flex-1 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#6b7280 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          {/* Canvas Scroll Container */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-8 custom-scrollbar bg-gray-100/50 dark:bg-black/20">
            <div
              className="relative shadow-2xl transition-transform duration-200 ease-out my-auto"
              style={{
                width: canvasWidth * canvasScale,
                height: canvasHeight * canvasScale,
                minWidth: canvasWidth * canvasScale, // Prevent shrinking
                minHeight: canvasHeight * canvasScale, // Prevent shrinking
              }}
            >
              {/* The Actual Scaled Canvas */}
              <div
                ref={canvasRef}
                className="bg-white origin-top-left overflow-hidden"
                style={{
                  width: canvasWidth,
                  height: canvasHeight,
                  transform: `scale(${canvasScale})`,
                  backgroundColor: backgroundColor,
                }}
                style={{
                  width: canvasWidth,
                  height: canvasHeight,
                  transform: `scale(${canvasScale})`,
                  backgroundColor: backgroundColor,
                }}
                onClick={handleCanvasClick}
              >
                {/* Grid Overlay */}
                {showGrid && !previewMode && (
                  <div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #f0f0f0 1px, transparent 1px),
                        linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px',
                    }}
                  />
                )}

                {/* Spirit Level - Center Guides */}
                {!previewMode && (
                  <>
                    {/* Vertical center line */}
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none z-0"
                      style={{
                        left: canvasWidth / 2,
                        width: '1px',
                        background: 'repeating-linear-gradient(to bottom, #3b82f6 0, #3b82f6 5px, transparent 5px, transparent 10px)',
                        opacity: 0.3
                      }}
                    />
                    {/* Horizontal center line */}
                    <div
                      className="absolute left-0 right-0 pointer-events-none z-0"
                      style={{
                        top: canvasHeight / 2,
                        height: '1px',
                        background: 'repeating-linear-gradient(to right, #3b82f6 0, #3b82f6 5px, transparent 5px, transparent 10px)',
                        opacity: 0.3
                      }}
                    />
                  </>
                )}

                {/* Elements */}
                {elements
                  .filter(el => el.visible)
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map(element => (
                    <ReportCardRenderer
                      key={element.id}
                      element={element}
                      isSelected={selectedElement === element.id}
                      isPreview={previewMode}
                      scale={1} // Pass 1 because the parent container is already scaled
                      onMouseDown={(e: React.MouseEvent) => handleMouseDown(e, element.id)}
                      data={schoolData ? {
                        schoolName: schoolData.name,
                        schoolAddress: `${schoolData.address_line1 || ''}${schoolData.address_line2 ? '\n' + schoolData.address_line2 : ''}\n${schoolData.city || ''}, ${schoolData.state || ''}`,
                        schoolMotto: schoolData.motto,
                        schoolLogo: schoolData.logo_url
                      } : undefined}
                      gradeTemplate={gradeTemplate || undefined}
                      isEditing={false}
                      onUpdate={(updates: Partial<TemplateElement>) => updateElement(element.id, updates)}
                      onEditEnd={() => { }}
                      onResizeStart={handleResizeStart}
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shadow-sm pointer-events-none select-none">
            {paperSize} {orientation === 'portrait' ? 'Portrait' : 'Landscape'} • {canvasWidth} × {canvasHeight}px
          </div>
        </div>
      </div>
    </div>,
    document.body
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
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  gradeTemplate: GradeTemplate | null;
  canvasWidth: number;
  canvasHeight: number;
  uploadedImages: string[];
  onUploadImage: (imageDataUrl: string) => void;
  onRemoveImage: (index: number) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ element, onUpdateElement, onDeleteElement, onDuplicateElement, gradeTemplate, canvasWidth, canvasHeight, uploadedImages, onUploadImage, onRemoveImage }) => {
  if (!element) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <AdjustmentsHorizontalIcon className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p>Select an element to edit its properties</p>
      </div>
    );
  }

  const isTable = ['grade_table', 'attendance_table', 'behavior_table', 'grading_scale'].includes(element.type);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-white">Properties</h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onDuplicateElement(element.id)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="Duplicate Element"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDeleteElement(element.id)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Delete Element (Del)"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Alignment Controls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Align</label>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => onUpdateElement(element.id, { x: 50 })}
              className="px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
              title="Align Left"
            >
              ← Left
            </button>
            <button
              onClick={() => onUpdateElement(element.id, { x: (canvasWidth - element.width) / 2 })}
              className="px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
              title="Center Horizontal"
            >
              ⬌ H-Center
            </button>
            <button
              onClick={() => onUpdateElement(element.id, { x: canvasWidth - element.width - 50 })}
              className="px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
              title="Align Right"
            >
              Right →
            </button>
            <button
              onClick={() => onUpdateElement(element.id, { y: 50 })}
              className="px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
              title="Align Top"
            >
              ↑ Top
            </button>
            <button
              onClick={() => onUpdateElement(element.id, { y: (canvasHeight - element.height) / 2 })}
              className="px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
              title="Center Vertical"
            >
              ⬍ V-Center
            </button>
            <button
              onClick={() => onUpdateElement(element.id, { y: canvasHeight - element.height - 50 })}
              className="px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
              title="Align Bottom"
            >
              ↓ Bottom
            </button>
            <button
              onClick={() => onUpdateElement(element.id, {
                x: (canvasWidth - element.width) / 2,
                y: (canvasHeight - element.height) / 2
              })}
              className="col-span-3 px-2 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded border border-blue-600"
              title="Center on Page"
            >
              ⊕ Center on Page
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
            <textarea
              value={element.content}
              onChange={(e) => onUpdateElement(element.id, { content: e.target.value })}
              rows={3}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Image Upload Section - Only for image elements */}
          {element.type === 'image' && (
            <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Image Settings</h4>

              {/* Upload Button */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Image ({uploadedImages.length}/5)
                </label>
                {uploadedImages.length < 5 ? (
                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <div className="text-center">
                      <PhotoIcon className="h-8 w-8 mx-auto text-gray-400 mb-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload image</span>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 2MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size <= 2 * 1024 * 1024) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const dataUrl = event.target?.result as string;
                            onUploadImage(dataUrl);
                          };
                          reader.readAsDataURL(file);
                        } else if (file) {
                          alert('Image must be less than 2MB');
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                ) : (
                  <p className="text-sm text-amber-600 dark:text-amber-400">Maximum 5 images reached. Remove an image to upload more.</p>
                )}
              </div>

              {/* Uploaded Images Gallery */}
              {uploadedImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Image</label>
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((img, index) => (
                      <div
                        key={index}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${element.content === img ? 'border-blue-500' : 'border-gray-200 dark:border-gray-600'}`}
                        onClick={() => onUpdateElement(element.id, { content: img })}
                      >
                        <img src={img} alt={`Uploaded ${index + 1}`} className="w-full h-16 object-cover" />
                        {element.content === img && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <span className="text-white text-xs font-medium bg-blue-500 px-2 py-0.5 rounded">Selected</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveImage(index);
                            if (element.content === img) {
                              onUpdateElement(element.id, { content: '' });
                            }
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Image Button */}
              {element.content && element.content !== 'Image Placeholder' && (
                <button
                  onClick={() => onUpdateElement(element.id, { content: '' })}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg transition-colors"
                >
                  Clear Image
                </button>
              )}
            </div>
          )}

          {/* Table Specific Properties */}
          {isTable && (
            <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Table Settings</h4>

              {element.type === 'grade_table' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preview Subjects Count</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={element.properties?.previewSubjectCount || 4}
                      onChange={(e) => {
                        const count = Math.min(20, Math.max(1, Number(e.target.value)));
                        // Auto-calculate table height: header (40px) + rows (count * 35px) + padding
                        const calculatedHeight = 40 + (count * 35) + 20;
                        onUpdateElement(element.id, {
                          properties: { ...element.properties, previewSubjectCount: count },
                          height: calculatedHeight
                        });
                      }}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Table height auto-adjusts (1-20)</p>
                  </div>

                  <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Visible Columns</h5>

                  {/* Component Columns */}
                  {gradeTemplate && gradeTemplate.assessment_components.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 space-y-2">
                      <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={element.properties?.showComponentColumns !== false}
                          onChange={(e) => onUpdateElement(element.id, { properties: { ...element.properties, showComponentColumns: e.target.checked } })}
                          className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium">Show Component Columns</span>
                      </label>

                      {element.properties?.showComponentColumns !== false && (
                        <div className="ml-6 space-y-1.5">
                          {gradeTemplate.assessment_components.map(component => (
                            <label key={component.id} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                              <input
                                type="checkbox"
                                checked={element.properties?.visibleComponents?.[component.id || ''] !== false}
                                onChange={(e) => {
                                  const visibleComponents = element.properties?.visibleComponents || {};
                                  onUpdateElement(element.id, {
                                    properties: {
                                      ...element.properties,
                                      visibleComponents: { ...visibleComponents, [component.id || '']: e.target.checked }
                                    }
                                  });
                                }}
                                className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                              />
                              <span>{component.name} ({component.weight}%)</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total, Grade, Remarks */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={element.properties?.showTotal !== false}
                        onChange={(e) => onUpdateElement(element.id, { properties: { ...element.properties, showTotal: e.target.checked } })}
                        className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Total Column</span>
                    </label>

                    <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={element.properties?.showGrade !== false}
                        onChange={(e) => onUpdateElement(element.id, { properties: { ...element.properties, showGrade: e.target.checked } })}
                        className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Grade Column</span>
                    </label>

                    <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={element.properties?.showRemarks || false}
                        onChange={(e) => onUpdateElement(element.id, { properties: { ...element.properties, showRemarks: e.target.checked } })}
                        className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Remarks Column</span>
                    </label>
                  </div>
                </div>
              )}

              <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={element.properties?.striped || false}
                  onChange={(e) => onUpdateElement(element.id, { properties: { ...element.properties, striped: e.target.checked } })}
                  className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Striped Rows</span>
              </label>

              <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={element.properties?.compact || false}
                  onChange={(e) => onUpdateElement(element.id, { properties: { ...element.properties, compact: e.target.checked } })}
                  className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Compact Mode</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Header Background</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={element.properties?.headerBackgroundColor === 'transparent' ? '#ffffff' : (element.properties?.headerBackgroundColor || '#f3f4f6')}
                    onChange={(e) => onUpdateElement(element.id, { properties: { ...element.properties, headerBackgroundColor: e.target.value } })}
                    className="h-8 w-16 rounded border border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={element.properties?.headerBackgroundColor || '#f3f4f6'}
                    onChange={(e) => onUpdateElement(element.id, { properties: { ...element.properties, headerBackgroundColor: e.target.value } })}
                    className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="#f3f4f6 or transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Header Text Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={element.properties?.headerTextColor === 'transparent' ? '#000000' : (element.properties?.headerTextColor || '#374151')}
                    onChange={(e) => onUpdateElement(element.id, { properties: { ...element.properties, headerTextColor: e.target.value } })}
                    className="h-8 w-16 rounded border border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={element.properties?.headerTextColor || '#374151'}
                    onChange={(e) => onUpdateElement(element.id, { properties: { ...element.properties, headerTextColor: e.target.value } })}
                    className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="#374151 or transparent"
                  />
                </div>
              </div>

              {/* Enhanced Column Settings */}
              {element.type === 'grade_table' && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-3">Column Settings</h5>
                  <div className="space-y-3">
                    {/* Helper to generate active column list */}
                    {(() => {
                      const columns = [{ key: 'subject', label: 'Subject' }];
                      if (gradeTemplate && element.properties?.showComponentColumns !== false) {
                        gradeTemplate.assessment_components.forEach(c => {
                          if (element.properties?.visibleComponents?.[c.id || ''] !== false) {
                            columns.push({ key: c.id || '', label: c.name });
                          }
                        });
                      }
                      if (element.properties?.showTotal !== false) columns.push({ key: 'total', label: 'Total' });
                      if (element.properties?.showGrade !== false) columns.push({ key: 'grade', label: 'Grade' });
                      if (element.properties?.showRemarks) columns.push({ key: 'remarks', label: 'Remarks' });

                      return columns.map(col => (
                        <div key={col.key} className="bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                          <div className="text-xs font-medium text-gray-500 mb-1">{col.label}</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-0.5">Header</label>
                              <input
                                type="text"
                                value={element.properties?.headerOverrides?.[col.key] || ''}
                                placeholder={col.label}
                                onChange={(e) => onUpdateElement(element.id, {
                                  properties: {
                                    ...element.properties,
                                    headerOverrides: { ...element.properties?.headerOverrides, [col.key]: e.target.value }
                                  }
                                })}
                                className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-0.5">Width</label>
                              <input
                                type="text"
                                value={element.properties?.columnWidths?.[col.key] || ''}
                                placeholder="Auto"
                                onChange={(e) => onUpdateElement(element.id, {
                                  properties: {
                                    ...element.properties,
                                    columnWidths: { ...element.properties?.columnWidths, [col.key]: e.target.value }
                                  }
                                })}
                                className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Position & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">X</label>
              <input
                type="number"
                value={Math.round(element.x)}
                onChange={(e) => onUpdateElement(element.id, { x: Number(e.target.value) })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(element.y)}
                onChange={(e) => onUpdateElement(element.id, { y: Number(e.target.value) })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Width</label>
              <input
                type="number"
                value={Math.round(element.width)}
                onChange={(e) => onUpdateElement(element.id, { width: Number(e.target.value) })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height</label>
              <input
                type="number"
                value={Math.round(element.height)}
                onChange={(e) => onUpdateElement(element.id, { height: Number(e.target.value) })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {FONTS.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Font Size</label>
                <select
                  value={element.fontSize}
                  onChange={(e) => onUpdateElement(element.id, { fontSize: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {FONT_SIZES.map(size => (
                    <option key={size} value={size}>{size}px</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight</label>
                <select
                  value={element.fontWeight}
                  onChange={(e) => onUpdateElement(element.id, { fontWeight: e.target.value as any })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Text Align</label>
                <select
                  value={element.textAlign}
                  onChange={(e) => onUpdateElement(element.id, { textAlign: e.target.value as any })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vertical Align</label>
                <select
                  value={element.verticalAlign || 'middle'}
                  onChange={(e) => onUpdateElement(element.id, { verticalAlign: e.target.value as any })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Text Transform</label>
                <select
                  value={element.textTransform || 'none'}
                  onChange={(e) => onUpdateElement(element.id, { textTransform: e.target.value as any })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">None</option>
                  <option value="uppercase">Uppercase</option>
                  <option value="lowercase">Lowercase</option>
                  <option value="capitalize">Capitalize</option>
                </select>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Text Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={element.color === 'transparent' ? '#000000' : element.color}
                  onChange={(e) => onUpdateElement(element.id, { color: e.target.value })}
                  className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer bg-white dark:bg-gray-700"
                />
                <input
                  type="text"
                  value={element.color}
                  onChange={(e) => onUpdateElement(element.id, { color: e.target.value })}
                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Background</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={element.backgroundColor === 'transparent' ? '#ffffff' : element.backgroundColor}
                  onChange={(e) => onUpdateElement(element.id, { backgroundColor: e.target.value })}
                  className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer bg-white dark:bg-gray-700"
                />
                <input
                  type="text"
                  value={element.backgroundColor}
                  onChange={(e) => onUpdateElement(element.id, { backgroundColor: e.target.value })}
                  placeholder="transparent"
                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Border */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Border Width</label>
                <input
                  type="number"
                  min="0"
                  value={element.borderWidth}
                  onChange={(e) => onUpdateElement(element.id, { borderWidth: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Border Style</label>
                <select
                  value={element.borderStyle}
                  onChange={(e) => onUpdateElement(element.id, { borderStyle: e.target.value as any })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Border Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={element.borderColor === 'transparent' ? '#000000' : element.borderColor}
                  onChange={(e) => onUpdateElement(element.id, { borderColor: e.target.value })}
                  className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer bg-white dark:bg-gray-700"
                />
                <input
                  type="text"
                  value={element.borderColor}
                  onChange={(e) => onUpdateElement(element.id, { borderColor: e.target.value })}
                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Advanced */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={element.opacity}
                  onChange={(e) => onUpdateElement(element.id, { opacity: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round(element.opacity * 100)}%</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rotation</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={element.rotation}
                  onChange={(e) => onUpdateElement(element.id, { rotation: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{element.rotation}°</div>
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
      <h3 className="font-medium text-gray-900 dark:text-white">Layers</h3>
      <div className="space-y-2">
        {sortedElements.map((element, index) => (
          <div
            key={element.id}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedElement === element.id
              ? 'border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
              }`}
            onClick={() => onSelectElement(element.id)}
          >
            <div className="flex items-center justify-between overflow-hidden">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateElement(element.id, { visible: !element.visible });
                  }}
                  className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${element.visible
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 dark:border-gray-600'
                    }`}
                >
                  {element.visible && <EyeIcon className="w-3 h-3 text-white" />}
                </button>
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                  {element.type === 'image' && element.content?.startsWith('data:')
                    ? 'Uploaded Image'
                    : (element.content?.split('\n')[0]?.substring(0, 20) || element.type)}
                </span>
                {element.locked && <LockClosedIcon className="flex-shrink-0 w-3 h-3 text-gray-400" />}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateElement(element.id, { locked: !element.locked });
                  }}
                  className={`p-1 rounded transition-colors ${element.locked ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  title={element.locked ? "Unlock Element" : "Lock Element"}
                >
                  {element.locked ? <LockClosedIcon className="w-3 h-3" /> : <LockOpenIcon className="w-3 h-3" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveElement(element.id, 'up');
                  }}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                >
                  <ArrowUpIcon className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveElement(element.id, 'down');
                  }}
                  disabled={index === sortedElements.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                >
                  <ArrowDownIcon className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateElement(element.id);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <DocumentDuplicateIcon className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteElement(element.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
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

export default ModernTemplateEditor;
