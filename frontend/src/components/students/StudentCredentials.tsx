import React, { useState, useEffect } from 'react';
import {
    ShieldCheckIcon,
    AcademicCapIcon,
    ArrowTopRightOnSquareIcon,
    CheckBadgeIcon,
    ClockIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import { credentialService } from '../../services/credentialService';
import LoadingSpinner from '../ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import IssueCredentialModal from './IssueCredentialModal';
import { useAuth } from '../../contexts/AuthContext';

interface Credential {
    id: string;
    title: string;
    credential_type: 'GRADE' | 'TRANSFER' | 'ATTENDANCE' | 'ACHIEVEMENT';
    description: string;
    status: 'PENDING' | 'MINTED' | 'FAILED' | 'REVOKED';
    transaction_hash: string | null;
    asset_name: string | null;
    policy_id: string | null;
    created_at: string;
}

interface StudentCredentialsProps {
    studentId: string;
    studentName?: string;
}

const StudentCredentials: React.FC<StudentCredentialsProps> = ({ studentId, studentName = 'Student' }) => {
    const { user } = useAuth();
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [showIssueModal, setShowIssueModal] = useState(false);

    const canIssueCredentials = user?.role && ['school_owner', 'school_admin', 'platform_super_admin'].includes(user.role);

    useEffect(() => {
        fetchCredentials();
    }, [studentId]);

    const fetchCredentials = async () => {
        try {
            setLoading(true);
            const data = await credentialService.getStudentCredentials(studentId);
            setCredentials(data);
        } catch (error) {
            console.error('Failed to fetch credentials:', error);
            toast.error('Failed to load credentials');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'GRADE': return AcademicCapIcon;
            case 'TRANSFER': return ArrowTopRightOnSquareIcon;
            case 'ATTENDANCE': return ClockIcon;
            default: return CheckBadgeIcon;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'GRADE': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
            case 'TRANSFER': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
            case 'ATTENDANCE': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
            default: return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'MINTED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'REVOKED': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            {/* Header with Issue Button */}
            {canIssueCredentials && (
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Verifiable Credentials
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Blockchain-verified academic records
                        </p>
                    </div>
                    <button
                        onClick={() => setShowIssueModal(true)}
                        className="btn-primary flex items-center"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Issue Credential
                    </button>
                </div>
            )}

            {credentials.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Credentials Yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        This student hasn't received any blockchain credentials yet.
                    </p>
                    {canIssueCredentials && (
                        <button
                            onClick={() => setShowIssueModal(true)}
                            className="mt-4 btn-secondary"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Issue First Credential
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {credentials.map((cred) => {
                        const Icon = getIcon(cred.credential_type);
                        const colorClass = getColor(cred.credential_type);
                        const statusColor = getStatusColor(cred.status);

                        return (
                            <Card key={cred.id} variant="glass" className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-xl ${colorClass}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                                            {cred.status}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                                        {cred.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 h-10">
                                        {cred.description || `${cred.credential_type} Credential`}
                                    </p>

                                    <div className="text-xs text-gray-400 mb-4">
                                        Issued: {new Date(cred.created_at).toLocaleDateString()}
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        {cred.transaction_hash ? (
                                            <a
                                                href={`https://preprod.cardanoscan.io/transaction/${cred.transaction_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
                                            >
                                                <ShieldCheckIcon className="h-4 w-4 mr-1" />
                                                Verify on Cardano
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400 flex items-center">
                                                <ClockIcon className="h-4 w-4 mr-1" />
                                                Confirming...
                                            </span>
                                        )}

                                        {cred.policy_id && cred.asset_name && (
                                            <a
                                                href={`/verify/${cred.policy_id}${cred.asset_name}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                View Details
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Decorative background pattern */}
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-white/5 to-white/20 rounded-full blur-xl pointer-events-none" />
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Issue Credential Modal */}
            <IssueCredentialModal
                studentId={studentId}
                studentName={studentName}
                isOpen={showIssueModal}
                onClose={() => setShowIssueModal(false)}
                onSuccess={fetchCredentials}
            />
        </div>
    );
};

export default StudentCredentials;
