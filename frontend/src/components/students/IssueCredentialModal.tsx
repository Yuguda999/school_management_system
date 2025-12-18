import React, { useState } from 'react';
import {
    ShieldCheckIcon,
    AcademicCapIcon,
    ArrowTopRightOnSquareIcon,
    ClockIcon,
    CheckBadgeIcon,
    XMarkIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { credentialService } from '../../services/credentialService';
import { toast } from 'react-hot-toast';

interface IssueCredentialModalProps {
    studentId: string;
    studentName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const credentialTypes = [
    {
        value: 'GRADE',
        label: 'Grade Report',
        description: 'Issue a verifiable grade/transcript credential',
        icon: AcademicCapIcon,
        color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    },
    {
        value: 'TRANSFER',
        label: 'Transfer Certificate',
        description: 'Official transfer documentation',
        icon: ArrowTopRightOnSquareIcon,
        color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
    },
    {
        value: 'ATTENDANCE',
        label: 'Attendance Record',
        description: 'Verified attendance credential',
        icon: ClockIcon,
        color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    },
    {
        value: 'ACHIEVEMENT',
        label: 'Achievement Award',
        description: 'Special achievement or award',
        icon: CheckBadgeIcon,
        color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
    }
];

const IssueCredentialModal: React.FC<IssueCredentialModalProps> = ({
    studentId,
    studentName,
    isOpen,
    onClose,
    onSuccess
}) => {
    const [selectedType, setSelectedType] = useState('GRADE');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        try {
            setLoading(true);
            await credentialService.issueCredential({
                student_id: studentId,
                credential_type: selectedType,
                title: title.trim(),
                description: description.trim(),
                claims: {
                    studentName,
                    issuedAt: new Date().toISOString()
                }
            });
            toast.success('Credential issued successfully! It will appear once confirmed on-chain.');
            onSuccess();
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setSelectedType('GRADE');
        } catch (error: any) {
            console.error('Failed to issue credential:', error);
            toast.error(error?.response?.data?.detail || 'Failed to issue credential');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-secondary-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <ShieldCheckIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Issue Credential</h3>
                                <p className="text-sm opacity-80">for {studentName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Credential Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Credential Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {credentialTypes.map((type) => {
                                const Icon = type.icon;
                                const isSelected = selectedType === type.value;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setSelectedType(type.value)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${type.color}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                                            {type.label}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {type.description}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., First Term Grade Report 2024"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the credential..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start">
                            <ShieldCheckIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                            This credential will be permanently recorded on the Cardano blockchain and cannot be modified once issued.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title.trim()}
                            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 rounded-lg shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Issuing...
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="h-4 w-4 mr-1" />
                                    Issue Credential
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IssueCredentialModal;
