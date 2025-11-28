import { apiService } from './api';
import { Asset, AssetCreate, AssetUpdate, AssetStats, AssetCategory, AssetCondition } from '../types';

class AssetService {
    async getAssets(params?: {
        category?: AssetCategory;
        condition?: AssetCondition;
        is_active?: boolean;
        search?: string;
        page?: number;
        size?: number;
    }): Promise<Asset[]> {
        const queryParams = new URLSearchParams();

        if (params?.category) queryParams.append('category', params.category);
        if (params?.condition) queryParams.append('condition', params.condition);
        if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.size) queryParams.append('size', params.size.toString());

        const url = `/api/v1/assets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return apiService.get<Asset[]>(url);
    }

    async getAsset(assetId: string): Promise<Asset> {
        return apiService.get<Asset>(`/api/v1/assets/${assetId}`);
    }

    async createAsset(assetData: AssetCreate): Promise<Asset> {
        return apiService.post<Asset>('/api/v1/assets', assetData);
    }

    async updateAsset(assetId: string, assetData: AssetUpdate): Promise<Asset> {
        return apiService.put<Asset>(`/api/v1/assets/${assetId}`, assetData);
    }

    async deleteAsset(assetId: string): Promise<void> {
        return apiService.delete<void>(`/api/v1/assets/${assetId}`);
    }

    async getAssetStats(): Promise<AssetStats> {
        return apiService.get<AssetStats>('/api/v1/assets/stats');
    }
}

export const assetService = new AssetService();
