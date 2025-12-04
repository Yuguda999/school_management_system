import { ClassLevel } from '../types';

export const getClassLevelDisplay = (level: ClassLevel): string => {
    return level.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
};
