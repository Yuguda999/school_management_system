import React, { useRef, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { FeePayment, SchoolInfo } from '../../types';
import { FeeService } from '../../services/feeService';
import { authService } from '../../services/authService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '../../hooks/useToast';

interface PaymentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment: FeePayment | null;
}

import { useCurrency } from '../../contexts/CurrencyContext';

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
    isOpen,
    onClose,
    payment,
}) => {
    const receiptRef = useRef<HTMLDivElement>(null);
    const { showSuccess, showError } = useToast();
    const { formatCurrency } = useCurrency();
    const [school, setSchool] = useState<SchoolInfo | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchSchoolDetails();
        }
    }, [isOpen]);

    const fetchSchoolDetails = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (user.school) {
                setSchool(user.school);
            }
        } catch (error) {
            console.error('Error fetching school details:', error);
        }
    };

    if (!payment) return null;

    const handleDownloadReceipt = async () => {
        if (!receiptRef.current) return;

        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Receipt-${payment.receipt_number}.pdf`);
            showSuccess('Receipt downloaded successfully');
        } catch (error) {
            console.error('Error generating receipt:', error);
            showError('Failed to generate receipt');
        }
    };

    const handlePrint = () => {
        // Create a hidden iframe to print just the receipt content
        const printContent = receiptRef.current?.innerHTML;

        if (printContent) {
            const printWindow = window.open('', '', 'height=600,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print Receipt</title>');
                printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">');
                printWindow.document.write('</head><body >');
                printWindow.document.write(printContent);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
            }
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
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
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                                    >
                                        Payment Details
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Receipt Content - This is what gets printed/downloaded */}
                                <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-sm mb-6" ref={receiptRef}>
                                    {/* Header */}
                                    <div className="border-b border-gray-200 pb-6 mb-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h1 className="text-2xl font-bold text-gray-900">{school?.name || 'SCHOOL NAME'}</h1>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {school ? (
                                                        <>
                                                            {school.address_line1}
                                                            {school.address_line2 && <>, {school.address_line2}</>}
                                                            <br />
                                                            {school.city}, {school.state} {school.postal_code}
                                                        </>
                                                    ) : (
                                                        '123 Education Street, Knowledge City'
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500">Phone: {school?.phone || '(555) 123-4567'}</p>
                                                <p className="text-sm text-gray-500">Email: {school?.email || 'info@school.edu'}</p>
                                            </div>
                                            <div className="text-right">
                                                <h2 className="text-xl font-semibold text-gray-900">PAYMENT RECEIPT</h2>
                                                <p className="text-sm text-gray-500 mt-1">Receipt #: {payment.receipt_number}</p>
                                                <p className="text-sm text-gray-500">Date: {FeeService.formatDate(payment.payment_date)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Student Info */}
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
                                            <p className="text-base font-medium text-gray-900">
                                                {payment.student_name || (payment.student ? `${payment.student.first_name} ${payment.student.last_name}` : 'Unknown Student')}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Admission No: {payment.student?.admission_number || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Class: {payment.student?.current_class_name || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payment Details</h3>
                                            <p className="text-sm text-gray-500">
                                                Method: <span className="capitalize">{payment.payment_method.replace('_', ' ')}</span>
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Transaction Ref: {payment.transaction_reference || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Status: <span className={`capitalize font-medium ${payment.fee_assignment?.status === 'paid' ? 'text-green-600' :
                                                    payment.fee_assignment?.status === 'partial' ? 'text-yellow-600' : 'text-gray-600'
                                                    }`}>{payment.fee_assignment?.status || 'Completed'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payment Table */}
                                    <table className="w-full mb-8">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 text-sm font-semibold text-gray-900">Description</th>
                                                <th className="text-right py-3 text-sm font-semibold text-gray-900">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-4 text-sm text-gray-900">
                                                    {payment.fee_assignment?.fee_structure?.name || 'Fee Payment'}
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {payment.fee_assignment?.fee_structure?.fee_type?.replace('_', ' ') || 'Tuition'} - {payment.fee_assignment?.term_name || 'Term'}
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right text-sm text-gray-900">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td className="pt-4 text-right text-sm font-medium text-gray-900">Total Paid:</td>
                                                <td className="pt-4 text-right text-lg font-bold text-gray-900">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                            </tr>
                                            {payment.fee_assignment && (
                                                <tr>
                                                    <td className="pt-2 text-right text-xs text-gray-500">Outstanding Balance:</td>
                                                    <td className="pt-2 text-right text-xs text-gray-500">
                                                        {formatCurrency(payment.fee_assignment.amount_outstanding)}
                                                    </td>
                                                </tr>
                                            )}
                                        </tfoot>
                                    </table>

                                    {/* Footer */}
                                    <div className="border-t border-gray-200 pt-6">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">Received By</p>
                                                <p className="text-sm font-medium text-gray-900">{payment.collector_name || 'Admin'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 italic">Thank you for your payment!</p>
                                                <p className="text-xs text-gray-300 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                        onClick={handlePrint}
                                    >
                                        <PrinterIcon className="h-4 w-4 mr-2" />
                                        Print
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        onClick={handleDownloadReceipt}
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default PaymentDetailsModal;
