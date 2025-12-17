import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FeeAssignment, CreateFeePaymentForm } from '../../types';
import { FeeService } from '../../services/feeService';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useToast } from '../../hooks/useToast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: FeeAssignment;
    onSuccess: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
    isOpen,
    onClose,
    assignment,
    onSuccess,
}) => {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<CreateFeePaymentForm>({
        defaultValues: {
            student_id: assignment.student_id,
            fee_assignment_id: assignment.id,
            amount: assignment.amount_outstanding,
            payment_method: 'cash',
            payment_date: new Date().toISOString().split('T')[0],
            notes: '',
        }
    });

    const { showSuccess, showError } = useToast();
    const { formatCurrency, currencySymbol, currency } = useCurrency();
    const amount = watch('amount');

    useEffect(() => {
        if (isOpen) {
            reset({
                student_id: assignment.student_id,
                fee_assignment_id: assignment.id,
                amount: assignment.amount_outstanding,
                payment_method: 'cash',
                payment_date: new Date().toISOString().split('T')[0],
                notes: '',
            });
        }
    }, [isOpen, assignment, reset]);

    const onSubmit = async (data: CreateFeePaymentForm) => {
        try {
            // Validate amount
            if (Number(data.amount) > Number(assignment.amount_outstanding)) {
                showError('Payment amount cannot exceed outstanding amount');
                return;
            }

            if (Number(data.amount) <= 0) {
                showError('Payment amount must be greater than 0');
                return;
            }

            await FeeService.createPayment({
                ...data,
                amount: Number(data.amount)
            });

            showSuccess('Payment recorded successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to record payment:', error);
            const errorMessage = error.response?.data?.detail;
            if (typeof errorMessage === 'string') {
                showError(errorMessage);
            } else if (Array.isArray(errorMessage)) {
                showError(errorMessage.map((e: any) => e.msg).join(', '));
            } else if (typeof errorMessage === 'object') {
                showError(JSON.stringify(errorMessage));
            } else {
                showError('Failed to record payment');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                Record Payment
                            </h3>
                            <button
                                onClick={onClose}
                                className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <span className="sr-only">Close</span>
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Student:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {assignment.student_name || (assignment.student ? `${assignment.student.first_name} ${assignment.student.last_name}` : 'Unknown')}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Fee Structure:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{assignment.fee_structure_name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Outstanding:</span>
                                <span className="font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(assignment.amount_outstanding)}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Amount
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">{currencySymbol}</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('amount', { required: 'Amount is required', min: 0.01 })}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="0.00"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">{currency}</span>
                                    </div>
                                </div>
                                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Payment Date
                                </label>
                                <input
                                    type="date"
                                    {...register('payment_date', { required: 'Payment date is required' })}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                {errors.payment_date && <p className="mt-1 text-sm text-red-600">{errors.payment_date.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Payment Method
                                </label>
                                <select
                                    {...register('payment_method', { required: 'Payment method is required' })}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="online">Online</option>
                                </select>
                                {errors.payment_method && <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Transaction ID / Reference (Optional)
                                </label>
                                <input
                                    type="text"
                                    {...register('transaction_id')}
                                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="e.g. TXN-123456"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    {...register('notes')}
                                    rows={3}
                                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Any additional notes..."
                                />
                            </div>

                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Recording...' : 'Record Payment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
