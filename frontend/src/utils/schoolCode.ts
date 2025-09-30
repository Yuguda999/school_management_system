/**
 * Utility functions for handling school codes in URLs
 */

/**
 * Get the school code from the current URL path
 * @returns The school code from the URL or null if not found
 */
export const getSchoolCodeFromUrl = (): string | null => {
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);
  
  // School code should be the first segment after the root
  // e.g., /SCHOOL123/dashboard -> SCHOOL123
  if (segments.length > 0) {
    return segments[0];
  }
  
  return null;
};

/**
 * Build a school-specific API endpoint URL
 * @param schoolCode - The school code
 * @param endpoint - The API endpoint (without leading slash)
 * @returns The full API URL with school code
 */
export const buildSchoolApiUrl = (schoolCode: string, endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `/api/v1/school/${schoolCode}/${cleanEndpoint}`;
};

/**
 * Build a school-specific frontend route URL
 * @param schoolCode - The school code
 * @param route - The frontend route (without leading slash)
 * @returns The full frontend URL with school code
 */
export const buildSchoolRouteUrl = (schoolCode: string, route: string): string => {
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
  return `/${schoolCode}/${cleanRoute}`;
};

/**
 * Extract school code from a URL path
 * @param pathname - The URL pathname
 * @returns The school code or null if not found
 */
export const extractSchoolCodeFromPath = (pathname: string): string | null => {
  const segments = pathname.split('/').filter(Boolean);
  
  // School code should be the first segment after the root
  if (segments.length > 0) {
    return segments[0];
  }
  
  return null;
};
