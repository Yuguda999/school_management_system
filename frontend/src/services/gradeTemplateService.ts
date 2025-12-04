import { apiService } from './api';
import {
    GradeTemplate,
    GradeTemplateCreate,
    GradeTemplateUpdate
} from '../types';

class GradeTemplateService {
    /**
     * Get all grade templates for the current school
     */
    static async getGradeTemplates(params?: {
        include_inactive?: boolean;
    }): Promise<GradeTemplate[]> {
        const queryParams = new URLSearchParams();

        if (params?.include_inactive !== undefined) {
            queryParams.append('include_inactive', params.include_inactive.toString());
        }

        const url = `/api/v1/grade-templates/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return await apiService.get<GradeTemplate[]>(url);
    }

    /**
     * Get a specific grade template by ID
     */
    static async getGradeTemplate(templateId: string): Promise<GradeTemplate> {
        return await apiService.get<GradeTemplate>(`/api/v1/grade-templates/${templateId}`);
    }

    /**
     * Get the school's default grade template
     */
    static async getDefaultTemplate(): Promise<GradeTemplate | null> {
        try {
            return await apiService.get<GradeTemplate>('/api/v1/grade-templates/default');
        } catch (error) {
            // If no default template exists, return null
            return null;
        }
    }

    /**
     * Create a new grade template
     */
    static async createGradeTemplate(data: GradeTemplateCreate): Promise<GradeTemplate> {
        return await apiService.post<GradeTemplate>('/api/v1/grade-templates/', data);
    }

    /**
     * Update an existing grade template
     */
    static async updateGradeTemplate(
        templateId: string,
        data: GradeTemplateUpdate
    ): Promise<GradeTemplate> {
        return await apiService.put<GradeTemplate>(`/api/v1/grade-templates/${templateId}`, data);
    }

    /**
     * Delete a grade template
     */
    static async deleteGradeTemplate(templateId: string): Promise<void> {
        await apiService.delete(`/api/v1/grade-templates/${templateId}`);
    }

    /**
     * Set a template as the school's default
     */
    static async setDefaultTemplate(templateId: string): Promise<GradeTemplate> {
        return await apiService.post<GradeTemplate>(
            `/api/v1/grade-templates/${templateId}/set-default`,
            {}
        );
    }

    /**
     * Validate that assessment components sum to 100%
     */
    static validateComponentWeights(components: Array<{ weight: number }>): {
        isValid: boolean;
        totalWeight: number;
        message?: string;
    } {
        const totalWeight = components.reduce((sum, comp) => sum + comp.weight, 0);

        if (Math.abs(totalWeight - 100) < 0.01) {
            return { isValid: true, totalWeight };
        }

        return {
            isValid: false,
            totalWeight,
            message: `Total weight must equal 100%, current total: ${totalWeight}%`
        };
    }

    /**
     * Validate that grade scales have no overlaps
     */
    static validateGradeScales(scales: Array<{ min_score: number; max_score: number; grade: string }>): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Sort by min_score
        const sortedScales = [...scales].sort((a, b) => a.min_score - b.min_score);

        // Check each scale
        for (let i = 0; i < sortedScales.length; i++) {
            const current = sortedScales[i];

            // Validate min < max
            if (current.min_score >= current.max_score) {
                errors.push(`Grade "${current.grade}": min score (${current.min_score}) must be less than max score (${current.max_score})`);
            }

            // Check for overlaps with next scale
            if (i < sortedScales.length - 1) {
                const next = sortedScales[i + 1];
                if (current.max_score >= next.min_score) {
                    errors.push(
                        `Grade "${current.grade}" (${current.min_score}-${current.max_score}) overlaps with "${next.grade}" (${next.min_score}-${next.max_score})`
                    );
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate that remark templates have no gaps or overlaps
     */
    static validateRemarkTemplates(remarks: Array<{ min_percentage: number; max_percentage: number }>): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (remarks.length === 0) {
            return { isValid: true, errors };
        }

        // Sort by min_percentage
        const sortedRemarks = [...remarks].sort((a, b) => a.min_percentage - b.min_percentage);

        // Check each remark
        for (let i = 0; i < sortedRemarks.length; i++) {
            const current = sortedRemarks[i];

            // Validate min < max
            if (current.min_percentage >= current.max_percentage) {
                errors.push(`Remark ${i + 1}: min percentage (${current.min_percentage}) must be less than max percentage (${current.max_percentage})`);
            }

            // Check for overlaps with next remark
            if (i < sortedRemarks.length - 1) {
                const next = sortedRemarks[i + 1];
                if (current.max_percentage > next.min_percentage) {
                    errors.push(
                        `Remark ${i + 1} (${current.min_percentage}-${current.max_percentage}%) overlaps with Remark ${i + 2} (${next.min_percentage}-${next.max_percentage}%)`
                    );
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get preset grade scale templates
     */
    static getPresetGradeScales(): Record<string, Array<{ grade: string; min_score: number; max_score: number; remark: string; color: string }>> {
        return {
            'A-F Scale': [
                { grade: 'A+', min_score: 95, max_score: 100, remark: 'Exceptional', color: '#10b981' },
                { grade: 'A', min_score: 90, max_score: 94, remark: 'Excellent', color: '#22c55e' },
                { grade: 'B+', min_score: 85, max_score: 89, remark: 'Very Good', color: '#84cc16' },
                { grade: 'B', min_score: 80, max_score: 84, remark: 'Good', color: '#eab308' },
                { grade: 'C+', min_score: 75, max_score: 79, remark: 'Satisfactory', color: '#f59e0b' },
                { grade: 'C', min_score: 70, max_score: 74, remark: 'Fair', color: '#f97316' },
                { grade: 'D', min_score: 60, max_score: 69, remark: 'Pass', color: '#ef4444' },
                { grade: 'F', min_score: 0, max_score: 59, remark: 'Fail', color: '#dc2626' }
            ],
            'Pass/Fail': [
                { grade: 'Pass', min_score: 50, max_score: 100, remark: 'Passed', color: '#10b981' },
                { grade: 'Fail', min_score: 0, max_score: 49, remark: 'Failed', color: '#ef4444' }
            ],
            '1-5 Scale': [
                { grade: '5', min_score: 90, max_score: 100, remark: 'Outstanding', color: '#10b981' },
                { grade: '4', min_score: 75, max_score: 89, remark: 'Very Good', color: '#22c55e' },
                { grade: '3', min_score: 60, max_score: 74, remark: 'Good', color: '#eab308' },
                { grade: '2', min_score: 45, max_score: 59, remark: 'Satisfactory', color: '#f97316' },
                { grade: '1', min_score: 0, max_score: 44, remark: 'Needs Improvement', color: '#ef4444' }
            ]
        };
    }

    /**
     * Get preset assessment component templates
     */
    static getPresetAssessmentComponents(): Record<string, Array<{ name: string; weight: number; is_required: boolean }>> {
        return {
            '3 CA + Exam': [
                { name: 'First C.A', weight: 15, is_required: true },
                { name: 'Second C.A', weight: 15, is_required: true },
                { name: 'Third C.A', weight: 10, is_required: true },
                { name: 'Exam', weight: 60, is_required: true }
            ],
            '2 CA + Exam': [
                { name: 'First C.A', weight: 20, is_required: true },
                { name: 'Second C.A', weight: 20, is_required: true },
                { name: 'Exam', weight: 60, is_required: true }
            ],
            '2 Tests + Exam': [
                { name: 'First Test', weight: 20, is_required: true },
                { name: 'Second Test', weight: 20, is_required: true },
                { name: 'Final Exam', weight: 60, is_required: true }
            ],
            'Exam Only': [
                { name: 'Exam', weight: 100, is_required: true }
            ]
        };
    }

    /**
     * Get suggested remark templates
     */
    static getSuggestedRemarks(): Array<{ min_percentage: number; max_percentage: number; remark_text: string }> {
        return [
            {
                min_percentage: 90,
                max_percentage: 100,
                remark_text: 'Exceptional performance! Keep up the outstanding work.'
            },
            {
                min_percentage: 80,
                max_percentage: 89,
                remark_text: 'Excellent work! You have demonstrated a strong understanding of the subject.'
            },
            {
                min_percentage: 70,
                max_percentage: 79,
                remark_text: 'Good performance. With more effort, you can achieve even greater results.'
            },
            {
                min_percentage: 60,
                max_percentage: 69,
                remark_text: 'Satisfactory performance. Focus on improving your understanding of key concepts.'
            },
            {
                min_percentage: 50,
                max_percentage: 59,
                remark_text: 'Fair performance. Additional study and practice are recommended.'
            },
            {
                min_percentage: 0,
                max_percentage: 49,
                remark_text: 'Needs significant improvement. Please seek additional support and dedicate more time to studying.'
            }
        ];
    }
}

export default GradeTemplateService;
