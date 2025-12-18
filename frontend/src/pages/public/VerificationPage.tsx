import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckBadgeIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { certificateService } from '../../services/certificateService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const VerificationPage: React.FC = () => {
    const { assetId } = useParams<{ assetId: string }>();
    const [searchParams] = useSearchParams();
    // Support both /verify/:assetId and /verify?id=:assetId
    const idToVerify = assetId || searchParams.get('id');

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (idToVerify) {
            verify(idToVerify);
        }
    }, [idToVerify]);

    const verify = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await certificateService.verifyCertificate(id);
            setResult(data);
        } catch (err: any) {
            console.error(err);
            setError("Certificate not found or invalid.");
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Certificate Verification
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Verify the authenticity of a digital transfer certificate.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : result ? (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                                <CheckBadgeIcon className="h-10 w-10 text-green-600" />
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                Valid Certificate
                            </h3>
                            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    This certificate is authentic and recorded on the Cardano blockchain.
                                </p>
                                {/* Display more details if available in result */}
                                <div className="mt-4 bg-gray-50 dark:bg-gray-700 p-3 rounded text-left text-sm">
                                    <p className="font-mono text-xs break-all text-gray-600 dark:text-gray-300">
                                        ID: {idToVerify}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                                <XCircleIcon className="h-10 w-10 text-red-600" />
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                Verification Failed
                            </h3>
                            <p className="mt-2 text-sm text-red-600">
                                {error}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p>Enter a certificate ID or scan a QR code to verify.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerificationPage;
