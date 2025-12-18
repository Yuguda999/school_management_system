import React, { useState, useEffect } from 'react';
import {
    ShieldCheckIcon,
    QrCodeIcon,
    CurrencyDollarIcon,
    ArrowPathIcon,
    CheckBadgeIcon,
    ExclamationTriangleIcon,
    AcademicCapIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { schoolService } from '../../services/schoolService';
import LoadingSpinner from '../ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code';

interface BlockchainStatus {
    enabled: boolean;
    wallet_address: string | null;
    balance: number;
    network: string;
}

const BlockchainSettings: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<BlockchainStatus | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        if (!user?.school_id) return;
        try {
            setRefreshing(true);
            const data = await schoolService.getBlockchainStatus(user.school_id);
            setStatus(data);
        } catch (error) {
            console.error('Failed to fetch blockchain status:', error);
            toast.error('Failed to load blockchain settings');
        } finally {
            setRefreshing(false);
        }
    };

    const handleEnableIdentity = async () => {
        if (!user?.school_id) return;
        setShowConfirmModal(false);

        try {
            setLoading(true);
            const response = await schoolService.enableBlockchain(user.school_id);
            toast.success(response.message);
            fetchStatus();
        } catch (error) {
            console.error('Failed to enable identity:', error);
            toast.error('Failed to enable school identity');
        } finally {
            setLoading(false);
        }
    };

    if (!status && loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-500 to-secondary-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white/20 rounded-xl">
                                        <ShieldCheckIcon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Enable School Identity</h3>
                                </div>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="flex items-start space-x-4 mb-6">
                                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
                                    <ShieldCheckIcon className="h-8 w-8" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                        Create Your Decentralized Identity
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        This action will generate a unique Cardano wallet and Digital Identity (DID) for your school.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                                <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                    What you'll be able to do:
                                </h5>
                                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <li className="flex items-center">
                                        <CheckBadgeIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                        Issue on-chain Verifiable Credentials
                                    </li>
                                    <li className="flex items-center">
                                        <CheckBadgeIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                        Create tamper-proof grade reports
                                    </li>
                                    <li className="flex items-center">
                                        <CheckBadgeIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                        Enable global credential verification
                                    </li>
                                </ul>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start mb-6">
                                <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                                You'll need to fund your wallet with testnet ADA to issue credentials.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEnableIdentity}
                                disabled={loading}
                                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 rounded-lg shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Generating...' : 'Enable Identity'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Identity Status Card */}
            <Card variant="glass">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <ShieldCheckIcon className="h-5 w-5 mr-2 text-primary-500" />
                                School Sovereign Identity
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Manage your school's decentralized identity (DID) and credential wallet.
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status?.enabled
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                {status?.enabled ? 'Active' : 'Not Enabled'}
                            </span>
                            {status?.enabled && (
                                <button
                                    onClick={fetchStatus}
                                    disabled={refreshing}
                                    className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                                    title="Refresh Balance"
                                >
                                    <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                                </button>
                            )}
                        </div>
                    </div>

                    {!status?.enabled ? (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-center">
                            <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                                Enable Your School's Digital Identity
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                                Generate a unique Cardano wallet to issue tamper-proof Verifiable Credentials (VCs) for your students.
                                This enables global verification of grades and certificates.
                            </p>
                            <button
                                onClick={() => setShowConfirmModal(true)}
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? 'Generating Identity...' : 'Enable Edix Identity'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Wallet Details */}
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Wallet Address (Public)
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <code className="flex-1 text-xs font-mono bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 break-all text-gray-600 dark:text-gray-300">
                                            {status.wallet_address}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(status.wallet_address || '');
                                                toast.success('Address copied!');
                                            }}
                                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                                        >
                                            <span className="text-xs font-bold">COPY</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        <ExclamationTriangleIcon className="h-3 w-3 inline mr-1 text-amber-500" />
                                        This address is used to pay for transaction fees when issuing credentials.
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-primary-500 to-secondary-600 p-4 rounded-xl text-white shadow-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium opacity-90">Wallet Balance</span>
                                        <CurrencyDollarIcon className="h-5 w-5 opacity-75" />
                                    </div>
                                    <div className="text-3xl font-bold">
                                        {status.balance} <span className="text-lg font-normal opacity-80">ADA</span>
                                    </div>
                                    <div className="mt-2 text-xs opacity-75 flex items-center">
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${status.network === 'mainnet' ? 'bg-green-400' : 'bg-yellow-400'
                                            }`}></span>
                                        Network: {status.network.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            {/* QR Code for Funding */}
                            <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                    <QrCodeIcon className="h-4 w-4 mr-2" />
                                    Fund Your Wallet
                                </h4>
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    {status.wallet_address && (
                                        <QRCode
                                            value={status.wallet_address}
                                            size={140}
                                            level="M"
                                        />
                                    )}
                                </div>
                                <p className="text-xs text-center text-gray-500 mt-4 max-w-xs">
                                    Scan to send ADA. You need ~0.2 ADA per credential issued.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Capabilities Card */}
            {status?.enabled && (
                <Card variant="glass">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Issuer Capabilities
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                                        <AcademicCapIcon className="h-5 w-5" />
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">Grade VCs</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Issue verifiable grade reports and transcripts.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg text-purple-600 dark:text-purple-300">
                                        <CheckBadgeIcon className="h-5 w-5" />
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">Certificates</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Issue transfer certificates and diplomas.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg text-orange-600 dark:text-orange-300">
                                        <ShieldCheckIcon className="h-5 w-5" />
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">Identity</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Manage student DIDs and access rights.
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default BlockchainSettings;
