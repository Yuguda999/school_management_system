import { apiService } from './api';

export interface SearchResult {
    id: string;
    type: 'student' | 'teacher' | 'staff' | 'subject' | 'class';
    title: string;
    subtitle: string;
    url: string;
    image?: string | null;
}

export interface SearchResponse {
    results: SearchResult[];
}

export const searchService = {
    search: async (query: string, limit: number = 10): Promise<SearchResult[]> => {
        if (!query || query.trim().length === 0) return [];

        try {
            const response = await apiService.get<SearchResponse>('/api/v1/search/', {
                params: { q: query, limit }
            });
            return response.results;
        } catch (error) {
            console.error('Search failed:', error);
            return [];
        }
    }
};
