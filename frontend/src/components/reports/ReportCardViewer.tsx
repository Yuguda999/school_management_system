import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ReportCardTemplate, TemplateService } from '../../services/templateService';
import { ReportCardRenderer } from '../templates/ReportCardRenderer';
import { studentService } from '../../services/studentService';
import gradeService, { StudentGradesSummary } from '../../services/gradeService';
import { attendanceService } from '../../services/attendanceService';
import { academicService } from '../../services/academicService';
import schoolService from '../../services/schoolService';
import gradeTemplateService from '../../services/gradeTemplateService';
import { useAuth } from '../../contexts/AuthContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';
import { GradeTemplate } from '../../types';

interface ReportCardViewerProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    classId?: string;
    className?: string;
    termId?: string;
}

export const ReportCardViewer: React.FC<ReportCardViewerProps> = ({
    isOpen,
    onClose,
    studentId,
    classId,
    className,
    termId,
}) => {
    const { user } = useAuth();
    const [template, setTemplate] = useState<ReportCardTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState<any>(null);
    const [summary, setSummary] = useState<StudentGradesSummary | null>(null);
    const [attendance, setAttendance] = useState<any>(null);
    const [schoolInfo, setSchoolInfo] = useState<any>(null);
    const [gradeTemplate, setGradeTemplate] = useState<GradeTemplate | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && studentId) {
            fetchData();
        }
    }, [isOpen, studentId, classId, termId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Student Details
            const studentData = await studentService.getStudentById(studentId);
            setStudentData(studentData);

            // 2. Fetch School Info
            let schoolInfoData: any = null;
            try {
                schoolInfoData = await schoolService.getCurrentSchool();
                setSchoolInfo(schoolInfoData);
            } catch (e) {
                console.error('Failed to fetch school info:', e);
            }

            // 3. Determine Template
            let templateId = null;

            if (classId) {
                try {
                    const classDetails = await academicService.getClass(classId);
                    templateId = classDetails.report_card_template_id;
                    console.log('ReportCardViewer: Class specific template:', templateId);

                    // Also try to fetch grade template for this class
                    // Note: This assumes a method exists or we fetch all and filter
                    // For now, we'll fetch all and use default if no specific assignment logic exists
                    const gradeTemplates = await gradeTemplateService.getGradeTemplates();
                    const defaultGradeTemplate = gradeTemplates.find(t => t.is_default) || gradeTemplates[0];
                    setGradeTemplate(defaultGradeTemplate || null);
                } catch (e) {
                    console.error('Failed to fetch class details or grade template:', e);
                }
            }

            if (!templateId && schoolInfoData?.default_template_id) {
                templateId = schoolInfoData.default_template_id;
                console.log('ReportCardViewer: Using school default template:', templateId);
            }

            // Fetch the actual template
            let templateData;
            if (templateId) {
                try {
                    templateData = await TemplateService.getTemplate(templateId);
                } catch (e) {
                    console.error('Failed to fetch template by ID:', templateId, e);
                }
            }

            // Fallback to default if no template found
            if (!templateData) {
                try {
                    const templates = await TemplateService.getTemplates();
                    templateData = templates.find(t => t.isDefault) || templates[0];
                } catch (e) {
                    console.error('Failed to fetch templates:', e);
                }
            }

            setTemplate(templateData);

            // 4. Fetch Grades Summary
            try {
                let currentTermId = termId;
                // If no termId, we should ideally fetch the current term. 
                // For now, we proceed if termId is present.
                if (currentTermId) {
                    const summaryData = await gradeService.getStudentGradesSummary(studentId, currentTermId);
                    setSummary(summaryData);
                } else {
                    setSummary(null);
                }
            } catch (e) {
                console.error("Failed to fetch grades summary", e);
                setSummary(null);
            }

            // 5. Fetch Attendance
            try {
                const schoolCode = getSchoolCodeFromUrl();
                if (termId && schoolCode) {
                    const attendanceData = await attendanceService.getStudentAttendanceSummary(schoolCode, studentId, { term_id: termId });
                    setAttendance(attendanceData);
                } else {
                    setAttendance(null);
                }
            } catch (e) {
                console.error("Failed to fetch attendance", e);
                setAttendance(null);
            }

        } catch (error) {
            console.error('Error fetching report card data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`ReportCard_${studentData?.first_name}_${studentData?.last_name}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    // Prepare data for renderer
    const rendererData = {
        // School Info
        schoolName: schoolInfo?.name,
        schoolAddress: schoolInfo?.address,
        schoolMotto: schoolInfo?.motto,
        schoolLogo: schoolInfo?.logo_url,

        // Student Info
        studentName: studentData ? `${studentData.first_name} ${studentData.last_name}` : '',
        className: className || studentData?.current_class_name || summary?.class_name,
        rollNumber: studentData?.admission_number,
        academicYear: summary?.term_name ? summary.term_name.split(' ')[0] : '2024/2025', // Fallback or parse from term
        term: summary?.term_name || 'First Term',

        // Summary Stats
        totalScore: summary?.total_score?.toString() || '0',
        maxScore: summary?.total_possible?.toString() || '0',
        percentage: summary?.overall_percentage?.toFixed(1) || '0',
        position: summary?.position?.toString() || '-',
        result: summary?.overall_grade ? (summary.overall_grade === 'F' ? 'Fail' : 'Pass') : '-', // Simple logic, can be refined

        // Attendance
        presentDays: attendance?.present_days?.toString() || '-',
        totalDays: attendance?.total_days?.toString() || '-',
        nextTermDate: 'TBD', // This usually comes from term settings, hardcoded for now or need to fetch term details

        // Tables
        // The renderer expects 'data' prop to contain these for specific elements if needed, 
        // or we can map them in the element loop. 
        // Actually, ReportCardRenderer uses 'data' prop for global replacement, 
        // and 'element.data' for table rows.
    };

    // Prepare grades for the table with component scores
    const gradeTableData = summary?.grades.map(g => {
        const rowData: any = {
            subject: g.subject_name || 'Unknown',
            score: g.score,
            total: g.score,
            grade: g.grade || '-',
            remark: g.remarks || ''
        };

        // Add component scores if available
        // component_scores format: {"First C.A": 12.5, "Second C.A": 13.0, "Exam": 58.0}
        if (g.component_scores) {
            rowData.components = g.component_scores;
        }

        return rowData;
    }) || [];

    console.log('📊 Report Card Data:', {
        studentId,
        termId,
        summaryExists: !!summary,
        gradesCount: summary?.grades?.length,
        gradeTableData: gradeTableData.length,
        sampleGrades: gradeTableData.slice(0, 2)
    });

    if (!isOpen) return null;

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                                {/* Header */}
                                <div className="bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                                        Report Card Preview
                                    </Dialog.Title>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={handlePrint}
                                            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                                            title="Print"
                                        >
                                            <PrinterIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={handleDownloadPDF}
                                            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                                            title="Download PDF"
                                        >
                                            <ArrowDownTrayIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="bg-gray-100 p-8 overflow-y-auto max-h-[80vh] flex justify-center">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-64">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : template ? (
                                        <div
                                            ref={reportRef}
                                            className="bg-white shadow-lg origin-top transform scale-90 relative"
                                            style={{
                                                width: template.paper_size === 'A4' ? '794px' : '816px', // Basic logic, can be improved
                                                height: template.paper_size === 'A4' ? '1123px' : '1056px',
                                                backgroundColor: template.background_color || '#ffffff'
                                            }}
                                        >
                                            {template.elements?.map((element: any) => {
                                                // Inject table data specifically
                                                let elementWithData = { ...element };
                                                if (element.type === 'grade_table') {
                                                    elementWithData.data = gradeTableData;
                                                } else if (element.type === 'attendance_table') {
                                                    elementWithData.data = attendance; // Renderer handles structure
                                                }

                                                return (
                                                    <ReportCardRenderer
                                                        key={element.id}
                                                        element={elementWithData}
                                                        scale={1}
                                                        isPreview={true}
                                                        data={rendererData}
                                                        gradeTemplate={gradeTemplate || undefined}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <p>No template found.</p>
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};
