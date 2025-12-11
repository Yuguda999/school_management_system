/**
 * Utility to get the proper image URL for displaying images
 * Handles both Cloudinary URLs (absolute) and local uploads (relative)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Get the full URL for an image, handling both Cloudinary and local storage
 * @param url - The image URL (can be absolute Cloudinary URL or relative local path)
 * @returns The full URL to display the image
 */
export function getImageUrl(url: string | null | undefined): string | undefined {
    if (!url) return undefined;

    // If it's already an absolute URL (Cloudinary, etc.), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // If it's a data URL, return as-is
    if (url.startsWith('data:')) {
        return url;
    }

    // Otherwise, it's a relative path - prepend the API base URL
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Get the school logo URL, with fallback handling
 * @param logoUrl - The school's logo_url from the API
 * @returns The full URL to display the logo, or undefined if not set
 */
export function getSchoolLogoUrl(logoUrl: string | null | undefined): string | undefined {
    return getImageUrl(logoUrl);
}

/**
 * Get the profile picture URL, with fallback handling
 * @param pictureUrl - The user's profile picture URL from the API
 * @returns The full URL to display the picture, or undefined if not set
 */
export function getProfilePictureUrl(pictureUrl: string | null | undefined): string | undefined {
    return getImageUrl(pictureUrl);
}
