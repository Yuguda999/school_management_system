import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon, ArrowDownTrayIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { certificateService, TransferCertificate } from '../../services/certificateService';
import LoadingSpinner from '../ui/LoadingSpinner';

interface CertificateGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
}

const CertificateGeneratorModal: React.FC<CertificateGeneratorModalProps> = ({
    isOpen,
    onClose,
    studentId,
    studentName,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [certificate, setCertificate] = useState<TransferCertificate | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const cert = await certificateService.generateCertificate(studentId);
            setCertificate(cert);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to generate certificate.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!certificate) return;
        try {
            const blob = await certificateService.downloadCertificate(certificate.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `certificate_${studentName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl w-full">
                    <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                            Digital Transfer Certificate
                        </Dialog.Title>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <span className="sr-only">Close</span>
                            <XCircleIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="mt-2">
                        {!certificate ? (
                            <>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    Generate a tamper-proof digital certificate for <strong>{studentName}</strong> on the Cardano blockchain.
                                    This action will mint a unique NFT representing the student's record.
                                </p>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading && <LoadingSpinner size="sm" />}
                                        {loading ? 'Minting...' : 'Generate Certificate'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Certificate Generated!</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    The certificate has been successfully minted on the blockchain.
                                </p>
                                <div className="mt-4 bg-gray-50 dark:bg-gray-700 p-3 rounded text-xs text-left font-mono break-all">
                                    <p><span className="font-bold">Tx Hash:</span> {certificate.transaction_hash}</p>
                                    <p className="mt-1"><span className="font-bold">Asset ID:</span> {certificate.policy_id}{certificate.asset_name}</p>
                                </div>

                                <div className="mt-6 flex flex-col gap-3">
                                    <button
                                        onClick={handleDownload}
                                        className="w-full flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                        Download PDF with QR Code
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default CertificateGeneratorModal;
