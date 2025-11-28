import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CubeIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { Asset, AssetStats, AssetCategory, AssetCondition } from '../../types';
import { assetService } from '../../services/assetService';
import { useToast } from '../../hooks/useToast';
import { usePermissions } from '../../hooks/usePermissions';
import { useCurrency } from '../../contexts/CurrencyContext';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/ui/Card';
import DataTable, { Column } from '../../components/ui/DataTable';
import AssetModal from '../../components/assets/AssetModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AssetsPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const { canManageSchool } = usePermissions();
  const { formatCurrency } = useCurrency();
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsData, statsData] = await Promise.all([
        assetService.getAssets({}),
        assetService.getAssetStats(),
      ]);
      setAssets(assetsData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to fetch assets:', error);
      showError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Asset>[] = [
    {
      key: 'name',
      header: 'Asset',
      sortable: true,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      sortable: true,
    },
    {
      key: 'condition',
      header: 'Condition',
      sortable: true,
    },
    {
      key: 'location',
      header: 'Location',
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Asset Management" description="Manage school physical resources" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Assets</p>
              <p className="text-2xl font-bold">{stats?.total_assets || 0}</p>
            </div>
            <CubeIcon className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(stats?.total_value || 0)}</p>
            </div>
            <BanknotesIcon className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Assets</p>
              <p className="text-2xl font-bold">{stats?.active_assets || 0}</p>
            </div>
            <CubeIcon className="h-8 w-8 text-emerald-500" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Assets</h3>
          {canManageSchool() && (
            <button onClick={() => { setSelectedAsset(null); setShowModal(true); }} className="btn btn-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Asset
            </button>
          )}
        </div>

        <DataTable
          data={assets}
          columns={columns}
          loading={loading}
          searchable={true}
          emptyMessage="No assets found"
          actions={canManageSchool() ? (asset) => (
            <>
              <button onClick={() => { setSelectedAsset(asset); setShowModal(true); }} className="btn btn-ghost btn-sm">
                <PencilIcon className="h-4 w-4" />
              </button>
              <button onClick={() => { setAssetToDelete(asset); setShowDeleteModal(true); }} className="btn btn-ghost btn-sm text-red-600">
                <TrashIcon className="h-4 w-4" />
              </button>
            </>
          ) : undefined}
        />
      </Card>

      <AssetModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedAsset(null); }}
        onSuccess={fetchData}
        asset={selectedAsset}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setAssetToDelete(null); }}
        onConfirm={async () => {
          if (assetToDelete) {
            try {
              await assetService.deleteAsset(assetToDelete.id);
              showSuccess('Asset deleted successfully');
              fetchData();
            } catch (error) {
              showError('Failed to delete asset');
            } finally {
              setShowDeleteModal(false);
              setAssetToDelete(null);
            }
          }
        }}
        title="Delete Asset"
        message={`Are you sure you want to delete "${assetToDelete?.name}"?`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default AssetsPage;
