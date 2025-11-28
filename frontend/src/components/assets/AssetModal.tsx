import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Asset, AssetCreate, AssetUpdate, AssetCategory, AssetCondition } from '../../types';
import { assetService } from '../../services/assetService';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    asset?: Asset | null;
}

const AssetModal: React.FC<AssetModalProps> = ({ isOpen, onClose, onSuccess, asset }) => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<AssetCreate>({
        name: '',
        category: AssetCategory.FURNITURE,
        description: '',
        quantity: 1,
        condition: AssetCondition.GOOD,
        location: '',
        purchase_date: '',
        purchase_price: undefined,
        serial_number: '',
        warranty_expiry: '',
        is_active: true,
    });

    useEffect(() => {
        if (asset) {
            setFormData({
                name: asset.name,
                category: asset.category,
                description: asset.description || '',
                quantity: asset.quantity,
                condition: asset.condition,
                location: asset.location || '',
                purchase_date: asset.purchase_date || '',
                purchase_price: asset.purchase_price,
                serial_number: asset.serial_number || '',
                warranty_expiry: asset.warranty_expiry || '',
                is_active: asset.is_active,
            });
        } else {
            // Reset form when creating new asset
            setFormData({
                name: '',
                category: AssetCategory.FURNITURE,
                description: '',
                quantity: 1,
                condition: AssetCondition.GOOD,
                location: '',
                purchase_date: '',
                purchase_price: undefined,
                serial_number: '',
                warranty_expiry: '',
                is_active: true,
            });
        }
    }, [asset, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showError('Asset name is required', 'Validation Error');
            return;
        }

        if (formData.quantity < 1) {
            showError('Quantity must be at least 1', 'Validation Error');
            return;
        }

        try {
            setLoading(true);

            // Clean form data - convert empty strings to undefined for optional fields
            const cleanedData = {
                ...formData,
                description: formData.description?.trim() || undefined,
                location: formData.location?.trim() || undefined,
                purchase_date: formData.purchase_date || undefined,
                purchase_price: formData.purchase_price || undefined,
                serial_number: formData.serial_number?.trim() || undefined,
                warranty_expiry: formData.warranty_expiry || undefined,
            };

            if (asset) {
                await assetService.updateAsset(asset.id, cleanedData as AssetUpdate);
                showSuccess('Asset updated successfully', 'Success');
            } else {
                await assetService.createAsset(cleanedData);
                showSuccess('Asset created successfully', 'Success');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to save asset:', error);

            // Extract error message from backend response
            let errorMessage = 'Failed to save asset';
            if (error.response?.data?.detail) {
                const detail = error.response.data.detail;
                if (typeof detail === 'string') {
                    errorMessage = detail;
                } else if (Array.isArray(detail)) {
                    // Handle validation errors array
                    errorMessage = detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
                } else if (typeof detail === 'object') {
                    errorMessage = JSON.stringify(detail);
                }
            }

            showError(errorMessage, 'Error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof AssetCreate, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const categoryOptions = [
        { value: AssetCategory.FURNITURE, label: 'Furniture' },
        { value: AssetCategory.BUILDING, label: 'Building' },
        { value: AssetCategory.EQUIPMENT, label: 'Equipment' },
        { value: AssetCategory.ELECTRONICS, label: 'Electronics' },
        { value: AssetCategory.VEHICLES, label: 'Vehicles' },
        { value: AssetCategory.SPORTS, label: 'Sports' },
        { value: AssetCategory.LABORATORY, label: 'Laboratory' },
        { value: AssetCategory.OTHER, label: 'Other' },
    ];

    const conditionOptions = [
        { value: AssetCondition.EXCELLENT, label: 'Excellent' },
        { value: AssetCondition.GOOD, label: 'Good' },
        { value: AssetCondition.FAIR, label: 'Fair' },
        { value: AssetCondition.POOR, label: 'Poor' },
        { value: AssetCondition.DAMAGED, label: 'Damaged' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={asset ? 'Edit Asset' : 'Add New Asset'}
            size="2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Asset Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="input"
                            placeholder="e.g., Office Desk, Laptop, Building A"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="input"
                            required
                        >
                            {categoryOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Condition */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Condition <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.condition}
                            onChange={(e) => handleChange('condition', e.target.value)}
                            className="input"
                            required
                        >
                            {conditionOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                            className="input"
                            min="1"
                            required
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Location
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            className="input"
                            placeholder="e.g., Room 101, Main Hall"
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="input"
                            rows={3}
                            placeholder="Additional details about the asset..."
                        />
                    </div>

                    {/* Purchase Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Purchase Date
                        </label>
                        <input
                            type="date"
                            value={formData.purchase_date}
                            onChange={(e) => handleChange('purchase_date', e.target.value)}
                            className="input"
                        />
                    </div>

                    {/* Purchase Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Purchase Price
                        </label>
                        <input
                            type="number"
                            value={formData.purchase_price || ''}
                            onChange={(e) => handleChange('purchase_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="input"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Serial Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Serial Number
                        </label>
                        <input
                            type="text"
                            value={formData.serial_number}
                            onChange={(e) => handleChange('serial_number', e.target.value)}
                            className="input"
                            placeholder="e.g., SN123456789"
                        />
                    </div>

                    {/* Warranty Expiry */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Warranty Expiry
                        </label>
                        <input
                            type="date"
                            value={formData.warranty_expiry}
                            onChange={(e) => handleChange('warranty_expiry', e.target.value)}
                            className="input"
                        />
                    </div>

                    {/* Is Active */}
                    <div className="md:col-span-2 flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => handleChange('is_active', e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                        />
                        <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Active
                        </label>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="btn btn-outline"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="sm" />
                                <span className="ml-2">Saving...</span>
                            </>
                        ) : (
                            asset ? 'Update Asset' : 'Create Asset'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AssetModal;
