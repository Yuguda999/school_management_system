import React, { useState, useEffect } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { GradeTemplate } from '../../types';
import { API_BASE_URL } from '../../services/api';

export interface TemplateElement {
    id: string;
    type: 'text' | 'table' | 'image' | 'line' | 'vertical_line' | 'rectangle' | 'rounded_rectangle' | 'circle' | 'shape' | 'school_logo' | 'school_header' | 'school_name' | 'school_address' | 'school_motto' | 'student_info' | 'student_name' | 'class_name' | 'roll_number' | 'academic_year' | 'term' | 'total_marks' | 'percentage' | 'position' | 'result' | 'attendance_summary' | 'next_term_date' | 'grade_table' | 'attendance_table' | 'behavior_table' | 'signature' | 'watermark' | 'grading_scale';
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
    verticalAlign?: 'top' | 'middle' | 'bottom';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    padding: number;
    borderRadius: number;
    boxShadow?: string;
    opacity: number;
    rotation: number;
    zIndex: number;
    locked: boolean;
    visible: boolean;
    properties?: Record<string, any>;
    data?: any;
}

interface ReportCardRendererProps {
    element: TemplateElement;
    isSelected?: boolean;
    isPreview?: boolean;
    scale?: number;
    onMouseDown?: (e: React.MouseEvent) => void;
    data?: any; // Real data to render
    gradeTemplate?: GradeTemplate; // Grade template for grading scale and components
    isEditing?: boolean;
    onUpdate?: (updates: Partial<TemplateElement>) => void;
    onEditEnd?: () => void;
    onResizeStart?: (e: React.MouseEvent, direction: string) => void;
}

const ResizeHandle = ({ direction, onMouseDown }: { direction: string; onMouseDown: (e: React.MouseEvent) => void }) => {
    const getPositionStyle = () => {
        switch (direction) {
            case 'nw': return { top: -3, left: -3, cursor: 'nw-resize' };
            case 'n': return { top: -3, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' };
            case 'ne': return { top: -3, right: -3, cursor: 'ne-resize' };
            case 'e': return { top: '50%', right: -3, transform: 'translateY(-50%)', cursor: 'e-resize' };
            case 'se': return { bottom: -3, right: -3, cursor: 'se-resize' };
            case 's': return { bottom: -3, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' };
            case 'sw': return { bottom: -3, left: -3, cursor: 'sw-resize' };
            case 'w': return { top: '50%', left: -3, transform: 'translateY(-50%)', cursor: 'w-resize' };
            default: return {};
        }
    };

    return (
        <div
            style={{
                position: 'absolute',
                width: 8,
                height: 8,
                backgroundColor: 'white',
                border: '1px solid #3b82f6',
                borderRadius: '50%',
                zIndex: 100,
                ...getPositionStyle()
            }}
            onMouseDown={(e) => {
                e.stopPropagation();
                onMouseDown(e);
            }}
        />
    );
};

export const ReportCardRenderer: React.FC<ReportCardRendererProps> = ({
    element,
    isSelected = false,
    isPreview = false,
    scale = 1,
    onMouseDown,
    data,
    gradeTemplate,
    isEditing = false,
    onUpdate,
    onEditEnd,
    onResizeStart,
}) => {
    if (!element) return null;

    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [data?.schoolLogo]);

    const elementStyle: React.CSSProperties = {
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.type === 'grading_scale' ? 'fit-content' : element.width,
        height: element.type === 'grading_scale' ? 'fit-content' : element.height,
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        textTransform: element.textTransform || 'none',
        color: element.color,
        backgroundColor: element.backgroundColor === 'transparent' ? 'transparent' : element.backgroundColor,
        border: element.borderWidth > 0 ? `${element.borderWidth}px ${element.borderStyle} ${element.borderColor}` : 'none',
        textAlign: element.textAlign,
        padding: element.padding,
        borderRadius: element.borderRadius,
        boxShadow: element.boxShadow || 'none',
        opacity: element.opacity,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: element.zIndex,
        cursor: isPreview ? 'default' : 'move',
        userSelect: 'none',
        boxSizing: 'border-box',
        outline: isSelected && !isPreview ? '2px solid #3b82f6' : 'none',
        outlineOffset: isSelected && !isPreview ? '2px' : '0',
        overflow: 'hidden',
    };

    // Helper to get table styles
    const getTableStyles = () => {
        const headerBg = element.properties?.headerBackgroundColor || '#f3f4f6';
        const headerColor = element.properties?.headerTextColor || '#374151';
        const borderColor = element.borderColor || '#e5e7eb';
        const striped = element.properties?.striped || false;
        const compact = element.properties?.compact || false;

        return { headerBg, headerColor, borderColor, striped, compact };
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate?.({ content: e.target.value });
    };

    const renderContent = () => {
        switch (element.type) {
            case 'text':
            case 'school_header':
            case 'school_name':
            case 'school_address':
            case 'school_motto':
            case 'student_info':
            case 'student_name':
            case 'class_name':
            case 'roll_number':
            case 'academic_year':
            case 'term':
            case 'total_marks':
            case 'percentage':
            case 'position':
            case 'result':
            case 'attendance_summary':
            case 'next_term_date':
            case 'signature':
            case 'watermark':
                if (isEditing) {
                    return (
                        <textarea
                            value={element.content}
                            onChange={handleContentChange}
                            onBlur={onEditEnd}
                            autoFocus
                            className="w-full h-full bg-transparent border-none outline-none resize-none p-0 m-0 overflow-hidden"
                            style={{
                                fontSize: 'inherit',
                                fontFamily: 'inherit',
                                fontWeight: 'inherit',
                                fontStyle: 'inherit',
                                color: 'inherit',
                                textAlign: 'inherit',
                                lineHeight: 'normal',
                            }}
                            onKeyDown={(e) => {
                                e.stopPropagation(); // Prevent deleting element on backspace/delete
                            }}
                        />
                    );
                }

                // Replace placeholders with real data or examples
                let content = element.content;
                if (data || ['school_header', 'school_name', 'school_address', 'school_motto', 'student_info', 'student_name', 'class_name', 'roll_number', 'academic_year', 'term', 'total_marks', 'percentage', 'position', 'result', 'attendance_summary', 'next_term_date'].includes(element.type)) {
                    // School data
                    const schoolName = data?.schoolName || 'GREENFIELD SECONDARY SCHOOL';
                    const schoolAddress = data?.schoolAddress || '123 Education Avenue, Academic District';
                    const schoolMotto = data?.schoolMotto || 'Excellence Through Knowledge';

                    // Student data  
                    const studentName = data?.studentName || 'Amaka Johnson';
                    const className = data?.className || 'JSS 3A';
                    const rollNumber = data?.rollNumber || 'GFS/2024/0123';
                    const academicYear = data?.academicYear || '2024/2025';
                    const term = data?.term || 'First Term';



                    // Summary data
                    const totalScore = data?.totalScore || '865';
                    const maxScore = data?.maxScore || '1300';
                    const percentage = data?.percentage || '67';
                    const position = data?.position || '5';
                    const result = data?.result || 'Qualified';
                    const presentDays = data?.presentDays || '118';
                    const totalDays = data?.totalDays || '122';
                    const nextTermDate = data?.nextTermDate || '9/1/2025';

                    content = content
                        .replace(/\[School Name\]/gi, schoolName)
                        .replace(/\[School Address\]/gi, schoolAddress)
                        .replace(/\[Motto\]/gi, schoolMotto)
                        .replace(/\[Student Name\]/gi, studentName)
                        .replace(/\[Class Name\]/gi, className)
                        .replace(/\[Class\]/gi, className)
                        .replace(/\[Roll Number\]/gi, rollNumber)
                        .replace(/\[Roll No\.?\]/gi, rollNumber)
                        .replace(/\[Academic Year\]/gi, academicYear)
                        .replace(/\[Term\]/gi, term)
                        .replace(/\[Total Score\]/gi, totalScore)
                        .replace(/\[Max Score\]/gi, maxScore)
                        .replace(/\[Percentage\]/gi, percentage)
                        .replace(/\[Position\]/gi, position)
                        .replace(/\[Result\]/gi, result)
                        .replace(/\[Present\]/gi, presentDays)
                        .replace(/\[Total Days\]/gi, totalDays)
                        .replace(/\[Next Term Date\]/gi, nextTermDate);
                }
                const verticalAlignClass = {
                    'top': 'justify-start',
                    'middle': 'justify-center',
                    'bottom': 'justify-end'
                }[element.verticalAlign || 'middle'];

                return (
                    <div className={`w-full h-full flex flex-col ${verticalAlignClass} whitespace-pre-line`}>
                        {content}
                    </div>
                );
            case 'school_logo':
                // Display actual school logo from data
                let logoUrl = data?.schoolLogo;

                // Handle relative URLs
                if (logoUrl && !logoUrl.startsWith('http') && !logoUrl.startsWith('data:') && !logoUrl.startsWith('blob:')) {
                    // Ensure proper slash handling
                    const baseUrl = API_BASE_URL.replace(/\/$/, '');
                    const path = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
                    logoUrl = `${baseUrl}${path}?t=cors`;
                }

                if (imgError || !logoUrl) {
                    return (
                        <div className="w-full h-full flex items-center justify-center p-2 bg-gray-50 text-gray-400 border border-dashed border-gray-300">
                            <PhotoIcon className="h-1/2 w-1/2" />
                        </div>
                    );
                }

                return (
                    <div className="w-full h-full flex items-center justify-center p-2">
                        <img
                            src={logoUrl}
                            alt="School Logo"
                            className="max-w-full max-h-full object-contain"
                            onError={() => setImgError(true)}
                            crossOrigin="anonymous"
                        />
                    </div>
                );

            case 'shape':
                return <div className="w-full h-full" />;



            case 'grade_table':
                const { headerBg, headerColor, borderColor, striped, compact } = getTableStyles();
                const cellPadding = compact ? '4px 8px' : '8px 12px';
                const hasCustomWidths = element.properties?.columnWidths && Object.keys(element.properties.columnWidths).length > 0;

                // Build columns definition
                const columns: { key: string, label: string }[] = [{ key: 'subject', label: 'Subject' }];

                // Add component columns
                if (gradeTemplate && element.properties?.showComponentColumns !== false) {
                    gradeTemplate.assessment_components.forEach(component => {
                        if (component.id && element.properties?.visibleComponents?.[component.id] !== false) {
                            columns.push({ key: component.id, label: component.name });
                        }
                    });
                }

                if (element.properties?.showTotal !== false) columns.push({ key: 'total', label: 'Total' });
                if (element.properties?.showGrade !== false) columns.push({ key: 'grade', label: 'Grade' });
                if (element.properties?.showRemarks) columns.push({ key: 'remarks', label: 'Remarks' });

                return (
                    <div className="w-full h-full overflow-hidden">
                        <table className="w-full text-inherit border-collapse" style={{ tableLayout: hasCustomWidths ? 'fixed' : 'auto' }}>
                            <colgroup>
                                {columns.map((col) => (
                                    <col key={col.key} style={{ width: element.properties?.columnWidths?.[col.key] || 'auto' }} />
                                ))}
                            </colgroup>
                            <thead>
                                <tr style={{ backgroundColor: headerBg, color: headerColor }}>
                                    {columns.map((col, idx) => (
                                        <th key={col.key} style={{
                                            border: `1px solid ${borderColor}`,
                                            padding: cellPadding,
                                            textAlign: idx === 0 ? 'left' : 'center',
                                            fontSize: compact ? '0.75em' : '1em'
                                        }}>
                                            {element.properties?.headerOverrides?.[col.key] || col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // Generate sample subjects based on preview count
                                    const previewCount = element.properties?.previewSubjectCount || 4;
                                    const sampleSubjects = [
                                        'Mathematics', 'English Language', 'Biology', 'Chemistry',
                                        'Physics', 'Geography', 'History', 'Civic Education',
                                        'Economics', 'Commerce', 'Literature', 'French',
                                        'Technical Drawing', 'Computer Studies', 'Agricultural Science', 'Physical Education',
                                        'Fine Arts', 'Music', 'Home Economics', 'Religious Studies'
                                    ];

                                    const grades = ['A', 'A', 'B+', 'A', 'B', 'A+', 'B+', 'A', 'B', 'A', 'B+', 'A', 'B', 'A+', 'A', 'B+', 'A', 'B', 'A', 'B+'];
                                    const remarks = ['Excellent', 'Excellent', 'Very Good', 'Excellent', 'Good', 'Outstanding', 'Very Good', 'Excellent', 'Good', 'Excellent', 'Very Good', 'Excellent', 'Good', 'Outstanding', 'Excellent', 'Very Good', 'Excellent', 'Good', 'Excellent', 'Very Good'];

                                    const sampleData = element.data || Array.from({ length: Math.min(previewCount, 20) }, (_, i) => {
                                        const baseScores = [12.5, 13.0, 11.0, 12.5, 10.5, 14.0, 13.5, 12.5, 10.5, 12.5, 11.5, 12.5, 10.5, 14.5, 12.5, 11.5, 12.5, 10.5, 12.5, 11.5];
                                        const examScores = [58.0, 54.5, 48.0, 53.5, 47.0, 63.5, 56.0, 58.0, 49.0, 58.0, 52.0, 58.0, 48.5, 64.0, 57.0, 53.0, 57.5, 49.5, 57.0, 52.5];
                                        const totals = [83.5, 78.0, 70.5, 77.5, 68.0, 92.0, 83.0, 83.5, 70.0, 83.0, 75.0, 83.0, 69.5, 93.0, 82.0, 76.0, 82.5, 70.5, 82.0, 75.5];

                                        return {
                                            subject: sampleSubjects[i],
                                            // Mock data structure matching columns logic
                                        };
                                    });

                                    // Helper to extract value safely
                                    const getValue = (row: any, key: string, label: string) => {
                                        if (key === 'subject') return row.subject;
                                        if (key === 'total') return row.total || row.score || '-';
                                        if (key === 'grade') return row.grade || (sampleData === element.data && grades[0]) || '-'; // Fallback for mock vs real
                                        if (key === 'remarks') return row.remarks || row.remark || '-';

                                        // Component check
                                        if (row.component_scores && row.component_scores[label]) return row.component_scores[label];
                                        if (row.components && row.components[label]) return row.components[label];
                                        if (row.components && row.components[key]) return row.components[key];

                                        // Mock data fallback for preview
                                        if (!element.data) {
                                            const idx = sampleSubjects.indexOf(row.subject);
                                            if (idx >= 0) {
                                                // Quick mock logic
                                                if (label.toLowerCase().includes('exam')) return 60;
                                                return 15;
                                            }
                                        }
                                        return '-';
                                    };

                                    return sampleData.map((row: any, i: number) => (
                                        <tr key={i} style={{ backgroundColor: striped && i % 2 === 1 ? '#f9fafb' : 'transparent' }}>
                                            {columns.map((col, idx) => (
                                                <td key={col.key} style={{
                                                    border: `1px solid ${borderColor}`,
                                                    padding: cellPadding,
                                                    textAlign: idx === 0 ? 'left' : 'center',
                                                    fontWeight: (col.key === 'total' || col.key === 'grade') ? 'bold' : 'normal'
                                                }}>
                                                    {getValue(row, col.key, col.label)}
                                                </td>
                                            ))}
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                );

            case 'attendance_table':
                const attStyles = getTableStyles();
                const attPadding = attStyles.compact ? '4px 8px' : '8px 12px';
                return (
                    <div className="w-full h-full overflow-hidden">
                        <table className="w-full text-inherit border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: attStyles.headerBg, color: attStyles.headerColor }}>
                                    <th style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'left' }}>Month</th>
                                    <th style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>Present</th>
                                    <th style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>Absent</th>
                                    <th style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>Late</th>
                                    <th style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {element.data ? (
                                    // If we have aggregated data (present, absent, etc.)
                                    <tr style={{ backgroundColor: 'transparent' }}>
                                        <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding }}>Current Term</td>
                                        <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>{element.data.present}</td>
                                        <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>{element.data.absent}</td>
                                        <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>{element.data.late}</td>
                                        <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>{element.data.total}</td>
                                    </tr>
                                ) : (
                                    [
                                        { month: 'September', present: 20, absent: 1, late: 1, total: 22 },
                                        { month: 'October', present: 22, absent: 0, late: 0, total: 22 },
                                        { month: 'November', present: 19, absent: 2, late: 1, total: 22 },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ backgroundColor: attStyles.striped && i % 2 === 1 ? '#f9fafb' : 'transparent' }}>
                                            <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding }}>{row.month}</td>
                                            <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>{row.present}</td>
                                            <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>{row.absent}</td>
                                            <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>{row.late}</td>
                                            <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>{row.total}</td>
                                        </tr>
                                    ))
                                )}
                                <tr style={{ fontWeight: 'bold', backgroundColor: attStyles.headerBg }}>
                                    <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding }}>Total</td>
                                    <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>61</td>
                                    <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>3</td>
                                    <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>2</td>
                                    <td style={{ border: `1px solid ${attStyles.borderColor}`, padding: attPadding, textAlign: 'center' }}>66</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                );

            case 'behavior_table':
                const behStyles = getTableStyles();
                const behPadding = behStyles.compact ? '4px 8px' : '8px 12px';
                return (
                    <div className="w-full h-full overflow-hidden">
                        <table className="w-full text-inherit border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: behStyles.headerBg, color: behStyles.headerColor }}>
                                    <th style={{ border: `1px solid ${behStyles.borderColor}`, padding: behPadding, textAlign: 'left' }}>Trait</th>
                                    <th style={{ border: `1px solid ${behStyles.borderColor}`, padding: behPadding, textAlign: 'center' }}>Rating</th>
                                    <th style={{ border: `1px solid ${behStyles.borderColor}`, padding: behPadding, textAlign: 'left' }}>Comment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { trait: 'Responsibility', rating: 'Excellent', comment: 'Always prepared' },
                                    { trait: 'Respect', rating: 'Good', comment: 'Polite to others' },
                                    { trait: 'Participation', rating: 'Very Good', comment: 'Active in class' },
                                ].map((row, i) => (
                                    <tr key={i} style={{ backgroundColor: behStyles.striped && i % 2 === 1 ? '#f9fafb' : 'transparent' }}>
                                        <td style={{ border: `1px solid ${behStyles.borderColor}`, padding: behPadding }}>{row.trait}</td>
                                        <td style={{ border: `1px solid ${behStyles.borderColor}`, padding: behPadding, textAlign: 'center' }}>{row.rating}</td>
                                        <td style={{ border: `1px solid ${behStyles.borderColor}`, padding: behPadding }}>{row.comment}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'grading_scale':
                const scaleStyles = getTableStyles();
                const scalePadding = scaleStyles.compact ? '2px 4px' : '4px 8px';

                // Use grade template scales if available, otherwise use defaults
                const gradeScales = gradeTemplate?.grade_scales || [
                    { grade: 'A+', min_score: 90, max_score: 100, remark: 'Outstanding' },
                    { grade: 'A', min_score: 80, max_score: 89, remark: 'Excellent' },
                    { grade: 'B', min_score: 70, max_score: 79, remark: 'Good' },
                    { grade: 'C', min_score: 60, max_score: 69, remark: 'Satisfactory' },
                    { grade: 'F', min_score: 0, max_score: 59, remark: 'Needs Improvement' },
                ];

                return (
                    <div className="w-full h-full overflow-hidden">
                        <div className="font-bold mb-1 text-sm">Grading Scale</div>
                        <table className="w-full text-inherit border-collapse text-xs">
                            <tbody>
                                {gradeScales.map((scale, i) => (
                                    <tr key={i}>
                                        <td style={{ border: `1px solid ${scaleStyles.borderColor}`, padding: scalePadding, fontWeight: 'bold' }}>{scale.grade}</td>
                                        <td style={{ border: `1px solid ${scaleStyles.borderColor}`, padding: scalePadding }}>{scale.min_score}-{scale.max_score}</td>
                                        <td style={{ border: `1px solid ${scaleStyles.borderColor}`, padding: scalePadding }}>{scale.remark}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'image':
                let imgSrc = element.content;
                if (imgSrc && imgSrc !== 'Image Placeholder' && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:') && !imgSrc.startsWith('blob:')) {
                    // Ensure proper slash handling
                    const baseUrl = API_BASE_URL.replace(/\/$/, '');
                    const path = imgSrc.startsWith('/') ? imgSrc : `/${imgSrc}`;
                    imgSrc = `${baseUrl}${path}?t=cors`;
                }

                const hasImage = imgSrc && imgSrc !== 'Image Placeholder';

                return (
                    <div className={`w-full h-full flex items-center justify-center overflow-hidden ${!hasImage ? 'bg-gray-50 border-2 border-dashed border-gray-300' : ''}`}>
                        {hasImage ? (
                            <img src={imgSrc} alt="Element" className="w-full h-full object-contain" crossOrigin="anonymous" />
                        ) : (
                            <div className="text-center">
                                <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                <div className="text-xs text-gray-500">Image</div>
                            </div>
                        )}
                    </div>
                );

            case 'line':
            case 'vertical_line':
                return <div className="w-full h-full" style={{ backgroundColor: element.backgroundColor || element.color || '#6b7280' }} />;

            case 'rectangle':
                return (
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundColor: element.backgroundColor || '#3b82f6',
                            borderWidth: element.borderWidth || 0,
                            borderColor: element.borderColor || 'transparent',
                            borderStyle: element.borderWidth ? 'solid' : 'none',
                        }}
                    />
                );

            case 'rounded_rectangle':
                return (
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundColor: element.backgroundColor || '#10b981',
                            borderRadius: element.borderRadius || 12,
                            borderWidth: element.borderWidth || 0,
                            borderColor: element.borderColor || 'transparent',
                            borderStyle: element.borderWidth ? 'solid' : 'none',
                        }}
                    />
                );

            case 'circle':
                return (
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundColor: element.backgroundColor || '#f59e0b',
                            borderRadius: '50%',
                            borderWidth: element.borderWidth || 0,
                            borderColor: element.borderColor || 'transparent',
                            borderStyle: element.borderWidth ? 'solid' : 'none',
                        }}
                    />
                );

            default:
                return <div className="w-full h-full flex items-center justify-center text-gray-500 border border-dashed border-gray-300">Unknown Element</div>;
        }
    };

    return (
        <div
            style={elementStyle}
            onMouseDown={onMouseDown}
            className={isSelected && !isPreview ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        >
            {renderContent()}

            {isSelected && !isPreview && !element.locked && onResizeStart && (
                <>
                    {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((dir) => (
                        <ResizeHandle
                            key={dir}
                            direction={dir}
                            onMouseDown={(e) => onResizeStart(e, dir)}
                        />
                    ))}
                </>
            )}
        </div>
    );
};
