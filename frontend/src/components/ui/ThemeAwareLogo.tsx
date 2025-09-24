import React, { useEffect, useState } from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface ThemeAwareLogoProps {
  logoUrl?: string;
  schoolName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFallback?: boolean;
  className?: string;
}

const ThemeAwareLogo: React.FC<ThemeAwareLogoProps> = ({
  logoUrl,
  schoolName,
  size = 'md',
  showFallback = true,
  className = '',
}) => {
  const [processedLogoUrl, setProcessedLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  // Get current theme colors
  useEffect(() => {
    const updateThemeColors = () => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      
      const primary = style.getPropertyValue('--color-primary-500');
      const secondary = style.getPropertyValue('--color-secondary-500');
      
      if (primary) {
        setPrimaryColor(`rgb(${primary})`);
      }
      if (secondary) {
        setSecondaryColor(`rgb(${secondary})`);
      }
    };

    updateThemeColors();

    // Listen for theme changes
    const observer = new MutationObserver(updateThemeColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, []);

  // Process logo with theme colors
  useEffect(() => {
    if (!logoUrl) {
      setProcessedLogoUrl(null);
      return;
    }

    // For now, just use the original logo
    // In a real implementation, you could:
    // 1. Apply CSS filters to tint the logo
    // 2. Use SVG manipulation to change colors
    // 3. Generate theme-specific logo variants
    setProcessedLogoUrl(logoUrl);
  }, [logoUrl, primaryColor, secondaryColor]);

  // Generate themed fallback logo
  const generateFallbackLogo = () => {
    const initials = schoolName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center shadow-lg ${className}`}
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }}
      >
        <span 
          className="font-bold text-white"
          style={{
            fontSize: size === 'sm' ? '0.75rem' : 
                     size === 'md' ? '0.875rem' : 
                     size === 'lg' ? '1.125rem' : '1.25rem'
          }}
        >
          {initials}
        </span>
      </div>
    );
  };

  // Apply theme-aware styling to logo
  const getLogoStyle = () => {
    return {
      filter: `drop-shadow(0 2px 4px ${primaryColor}20)`,
    };
  };

  if (processedLogoUrl) {
    return (
      <img
        src={processedLogoUrl}
        alt={`${schoolName} logo`}
        className={`${sizeClasses[size]} rounded object-contain ${className}`}
        style={getLogoStyle()}
        onError={() => setProcessedLogoUrl(null)}
      />
    );
  }

  if (showFallback) {
    return generateFallbackLogo();
  }

  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
      <BuildingOfficeIcon className="h-1/2 w-1/2 text-gray-500 dark:text-gray-400" />
    </div>
  );
};

export default ThemeAwareLogo;
