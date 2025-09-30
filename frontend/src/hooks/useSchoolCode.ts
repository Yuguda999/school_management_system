import { useParams } from 'react-router-dom';

/**
 * Hook to get the current school code from the URL parameters
 * @returns The school code from the URL or null if not found
 */
export const useSchoolCode = (): string | null => {
  const { schoolCode } = useParams<{ schoolCode: string }>();
  return schoolCode || null;
};
