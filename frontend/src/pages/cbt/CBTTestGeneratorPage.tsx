import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, SparklesIcon, BoltIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { cbtService } from '../../services/cbtService';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';
import PageHeader from '../../components/Layout/PageHeader';

interface GeneratorFormData {
    subject: string;
    topic: string;
    difficulty_level: string;
    question_count: number;
    additional_context?: string;
}

const CBTTestGeneratorPage: React.FC = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const schoolCode = getSchoolCodeFromUrl();
    const [generating, setGenerating] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<GeneratorFormData>({
        defaultValues: {
            question_count: 10,
            difficulty_level: 'medium'
        }
    });

    const onSubmit = async (data: GeneratorFormData) => {
        setGenerating(true);
        try {
            const generatedTest = await cbtService.generateTest(data);
            showSuccess('Test generated successfully!');
            // Navigate to create page with pre-filled data
            navigate(`/${schoolCode}/cbt/tests/new`, { state: { generatedTest } });
        } catch (error: any) {
            showError(error.response?.data?.detail || 'Failed to generate test');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/${schoolCode}/cbt/tests`)}
                    className="btn btn-secondary"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <PageHeader
                    title="Generate CBT Test with AI"
                    description="Automatically create questions and answers using AI"
                />
            </div>

            <div className="card p-8">
                <div className="flex items-center justify-center mb-8">
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <SparklesIcon className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="label">Subject *</label>
                            <input
                                {...register('subject', { required: 'Subject is required' })}
                                className="input w-full"
                                placeholder="e.g., Mathematics, Biology, History"
                            />
                            {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="label">Topic *</label>
                            <input
                                {...register('topic', { required: 'Topic is required' })}
                                className="input w-full"
                                placeholder="e.g., Algebra, Photosynthesis, World War II"
                            />
                            {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>}
                        </div>

                        <div>
                            <label className="label">Difficulty Level *</label>
                            <select
                                {...register('difficulty_level', { required: 'Difficulty is required' })}
                                className="input w-full"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                                <option value="challenging">Challenging</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Number of Questions *</label>
                            <input
                                type="number"
                                {...register('question_count', {
                                    required: 'Question count is required',
                                    min: { value: 1, message: 'Minimum 1 question' },
                                    max: { value: 50, message: 'Maximum 50 questions' }
                                })}
                                className="input w-full"
                            />
                            {errors.question_count && <p className="text-red-500 text-sm mt-1">{errors.question_count.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="label">Additional Context (Optional)</label>
                            <textarea
                                {...register('additional_context')}
                                className="input w-full"
                                rows={3}
                                placeholder="Any specific requirements, focus areas, or constraints..."
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={generating}
                            className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg"
                        >
                            {generating ? (
                                <>
                                    <BoltIcon className="h-6 w-6 animate-pulse" />
                                    Generating Test...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-6 w-6" />
                                    Generate Test
                                </>
                            )}
                        </button>
                        <p className="text-center text-sm text-gray-500 mt-4">
                            The AI will generate a complete test structure including questions, options, and correct answers.
                            You can review and edit everything before saving.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CBTTestGeneratorPage;
