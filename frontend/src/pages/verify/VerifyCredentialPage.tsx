import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ShieldCheckIcon,
    CheckBadgeIcon,
    XCircleIcon,
    ArrowTopRightOnSquareIcon,
    AcademicCapIcon,
    ClockIcon,
    BuildingOfficeIcon,
    UserIcon,
    CalendarIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';

interface VerificationResult {
    valid: boolean;
    credential?: {
        id: string;
        title: string;
        credential_type: string;
        description: string;
        status: string;
        transaction_hash: string | null;
        created_at: string;
        issuer_name?: string;
        subject_name?: string;
    };
    onChainData?: {
        policy_id: string;
        asset_name: string;
        metadata?: any;
    };
    error?: string;
}

const VerifyCredentialPage: React.FC = () => {
    const { assetId } = useParams<{ assetId: string }>();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [manualInput, setManualInput] = useState('');

    useEffect(() => {
        if (assetId) {
            verifyCredential(assetId);
        } else {
            setLoading(false);
        }
    }, [assetId]);

    const verifyCredential = async (id: string) => {
        setLoading(true);
        try {
            // Call public API endpoint
            const response = await fetch(`/api/v1/credentials/verify/${id}`);
            const data = await response.json();

            if (response.ok) {
                setResult(data);
            } else {
                setResult({
                    valid: false,
                    error: data.detail || 'Credential not found'
                });
            }
        } catch (error) {
            setResult({
                valid: false,
                error: 'Failed to verify credential'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleManualVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualInput.trim()) {
            window.location.href = `/verify/${manualInput.trim()}`;
        }
    };

    const getTypeIcon = (type?: string) => {
        switch (type) {
            case 'GRADE': return AcademicCapIcon;
            case 'TRANSFER': return ArrowTopRightOnSquareIcon;
            case 'ATTENDANCE': return ClockIcon;
            default: return CheckBadgeIcon;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <header className="border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl">
                            <ShieldCheckIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Edix Verify</span>
                    </Link>
                    <a
                        href="https://cardano.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-white transition-colors flex items-center"
                    >
                        Powered by Cardano
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                    </a>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Verify Academic Credentials
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto">
                        Instantly verify the authenticity of blockchain-secured academic credentials issued through Edix.
                    </p>
                </div>

                {/* Manual Input Form */}
                {!assetId && (
                    <form onSubmit={handleManualVerify} className="mb-12">
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                Enter Credential ID or Transaction Hash
                            </label>
                            <div className="flex space-x-3">
                                <input
                                    type="text"
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    placeholder="e.g., policy_id + asset_name or tx_hash"
                                    className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-secondary-700 transition-all shadow-lg shadow-primary-500/30"
                                >
                                    Verify
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 mb-4">
                            <svg className="animate-spin h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                        <p className="text-gray-400">Verifying credential on-chain...</p>
                    </div>
                )}

                {/* Result Display */}
                {!loading && result && (
                    <div className={`rounded-2xl overflow-hidden border ${result.valid
                            ? 'border-green-500/30 bg-green-900/10'
                            : 'border-red-500/30 bg-red-900/10'
                        }`}>
                        {/* Status Header */}
                        <div className={`p-6 flex items-center space-x-4 ${result.valid
                                ? 'bg-gradient-to-r from-green-600 to-green-500'
                                : 'bg-gradient-to-r from-red-600 to-red-500'
                            }`}>
                            {result.valid ? (
                                <CheckBadgeIcon className="h-12 w-12 text-white" />
                            ) : (
                                <XCircleIcon className="h-12 w-12 text-white" />
                            )}
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {result.valid ? 'Credential Verified' : 'Verification Failed'}
                                </h2>
                                <p className="text-white/80">
                                    {result.valid
                                        ? 'This credential is authentic and recorded on the Cardano blockchain.'
                                        : result.error || 'This credential could not be verified.'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Credential Details */}
                        {result.valid && result.credential && (
                            <div className="p-6 space-y-6">
                                {/* Title */}
                                <div className="flex items-start space-x-4">
                                    {(() => {
                                        const Icon = getTypeIcon(result.credential.credential_type);
                                        return (
                                            <div className="p-3 bg-primary-500/20 rounded-xl text-primary-400">
                                                <Icon className="h-8 w-8" />
                                            </div>
                                        );
                                    })()}
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{result.credential.title}</h3>
                                        <p className="text-gray-400">{result.credential.description}</p>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-800/50 rounded-xl p-4">
                                        <div className="flex items-center text-gray-400 text-sm mb-1">
                                            <DocumentTextIcon className="h-4 w-4 mr-2" />
                                            Type
                                        </div>
                                        <div className="text-white font-medium">
                                            {result.credential.credential_type}
                                        </div>
                                    </div>

                                    <div className="bg-gray-800/50 rounded-xl p-4">
                                        <div className="flex items-center text-gray-400 text-sm mb-1">
                                            <CalendarIcon className="h-4 w-4 mr-2" />
                                            Issued
                                        </div>
                                        <div className="text-white font-medium">
                                            {new Date(result.credential.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {result.credential.issuer_name && (
                                        <div className="bg-gray-800/50 rounded-xl p-4">
                                            <div className="flex items-center text-gray-400 text-sm mb-1">
                                                <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                                                Issuer
                                            </div>
                                            <div className="text-white font-medium">
                                                {result.credential.issuer_name}
                                            </div>
                                        </div>
                                    )}

                                    {result.credential.subject_name && (
                                        <div className="bg-gray-800/50 rounded-xl p-4">
                                            <div className="flex items-center text-gray-400 text-sm mb-1">
                                                <UserIcon className="h-4 w-4 mr-2" />
                                                Subject
                                            </div>
                                            <div className="text-white font-medium">
                                                {result.credential.subject_name}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Blockchain Proof */}
                                {result.credential.transaction_hash && (
                                    <div className="bg-gray-800/50 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-gray-400 mb-1">Transaction Hash</div>
                                                <code className="text-xs font-mono text-gray-300 break-all">
                                                    {result.credential.transaction_hash}
                                                </code>
                                            </div>
                                            <a
                                                href={`https://preprod.cardanoscan.io/transaction/${result.credential.transaction_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-shrink-0 ml-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                View on Explorer
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                        <ShieldCheckIcon className="h-8 w-8 text-primary-400 mb-4" />
                        <h3 className="font-semibold text-white mb-2">Tamper-Proof</h3>
                        <p className="text-sm text-gray-400">
                            Credentials are immutably recorded on the Cardano blockchain.
                        </p>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                        <CheckBadgeIcon className="h-8 w-8 text-green-400 mb-4" />
                        <h3 className="font-semibold text-white mb-2">Instantly Verifiable</h3>
                        <p className="text-sm text-gray-400">
                            Anyone can verify credentials without contacting the issuing school.
                        </p>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                        <DocumentTextIcon className="h-8 w-8 text-blue-400 mb-4" />
                        <h3 className="font-semibold text-white mb-2">W3C Standard</h3>
                        <p className="text-sm text-gray-400">
                            Follows Verifiable Credentials data model for interoperability.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800 mt-16 py-8">
                <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>Edix Credential Verification System • Secured by Cardano Blockchain</p>
                </div>
            </footer>
        </div>
    );
};

export default VerifyCredentialPage;
