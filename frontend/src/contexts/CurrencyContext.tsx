import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

interface CurrencyContextType {
    currency: string;
    currencySymbol: string;
    setCurrency: (currency: string) => Promise<void>;
    formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

interface CurrencyProviderProps {
    children: ReactNode;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    KES: 'KSh',
    GHS: 'GH₵',
    ZAR: 'R',
    INR: '₹',
    JPY: '¥',
    CNY: '¥',
    AUD: 'A$',
    CAD: 'C$',
};

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const [currency, setCurrencyState] = useState<string>('USD');
    const [currencySymbol, setCurrencySymbol] = useState<string>('$');

    useEffect(() => {
        // Fetch school settings to get currency
        const fetchCurrency = async () => {
            try {
                const data = await apiService.get<any>('/api/v1/schools/me');
                const schoolCurrency = data.settings?.currency || 'USD';
                setCurrencyState(schoolCurrency);
                setCurrencySymbol(CURRENCY_SYMBOLS[schoolCurrency] || schoolCurrency);
            } catch (error) {
                console.error('Failed to fetch currency settings:', error);
                // Default to USD if fetch fails
                setCurrencyState('USD');
                setCurrencySymbol('$');
            }
        };

        if (user) {
            fetchCurrency();
        }
    }, [user]);

    const setCurrency = async (newCurrency: string) => {
        try {
            await apiService.put('/api/v1/schools/me', {
                settings: {
                    currency: newCurrency
                }
            });
            setCurrencyState(newCurrency);
            setCurrencySymbol(CURRENCY_SYMBOLS[newCurrency] || newCurrency);
        } catch (error) {
            console.error('Failed to update currency:', error);
            throw error;
        }
    };

    const formatAmount = (amount: number): string => {
        const formatted = amount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
        return `${currencySymbol}${formatted}`;
    };

    return (
        <CurrencyContext.Provider
            value={{
                currency,
                currencySymbol,
                setCurrency,
                formatAmount,
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
};
