import React, { useState, useEffect } from 'react';
import {
    ShieldCheckIcon,
    AcademicCapIcon,
    ArrowTopRightOnSquareIcon,
    CheckBadgeIcon,
    ClockIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import { credentialService, Credential } from '../../services/credentialService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

const StudentCredentialsPage: React.FC = () => {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCredentials();
    }, []);

    const fetchCredentials = async () => {
        try {
            setLoading(true);
            const data = await credentialService.getMyCredentials();
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <ShieldCheckIcon className="h-8 w-8 mr-3 text-primary-500" />
                        My Credentials
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Your blockchain-verified academic credentials
                    </p>
                </div>
                <button
                    onClick={fetchCredentials}
                    className="btn-secondary flex items-center"
                >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Refresh
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-200 dark:border-primary-800 rounded-2xl p-6">
                <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                        <ShieldCheckIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Verifiable Credentials
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            These credentials are permanently recorded on the Cardano blockchain.
                            They can be verified by anyone, anywhere in the world, and cannot be forged or tampered with.
                        </p>
                    </div>
                </div>
            </div>

            {/* Credentials Grid */}
            {credentials.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <ShieldCheckIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                        No Credentials Yet
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        You haven't received any blockchain credentials yet. Your school will issue credentials for your academic achievements.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {credentials.map((cred) => {
                        const Icon = getIcon(cred.credential_type);
                        const colorClass = getColor(cred.credential_type);
                        const statusColor = getStatusColor(cred.status);

                        return (
                            <Card key={cred.id} variant="glass" className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-xl ${colorClass}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColor}`}>
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
                                                className="flex items-center text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors font-medium"
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
                                    </div>
                                </div>

                                {/* Decorative background */}
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-white/5 to-white/20 rounded-full blur-xl pointer-events-none" />
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentCredentialsPage;
