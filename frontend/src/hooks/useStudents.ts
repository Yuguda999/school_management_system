import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { studentService } from '../services/studentService';
import { useToast } from '../hooks/useToast';
import { Student, PaginatedResponse } from '../types';

export const useStudents = (filters?: any) => {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();

    const studentsQuery = useQuery<PaginatedResponse<Student>>({
        queryKey: ['students', filters],
        queryFn: () => studentService.getStudents(filters),
        placeholderData: keepPreviousData,
    });

    const deleteStudentMutation = useMutation({
        mutationFn: (id: string) => studentService.deleteStudent(id),
        onMutate: async (deletedId) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['students'] });

            // Snapshot the previous value
            const previousStudents = queryClient.getQueryData(['students', filters]);

            // Optimistically update to remove the student
            if (previousStudents) {
                queryClient.setQueryData(['students', filters], (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        items: old.items.filter((s: Student) => s.id !== deletedId)
                    };
                });
            }

            return { previousStudents };
        },
        onError: (_err, _newTodo, context) => {
            // Rollback to previous value
            if (context?.previousStudents) {
                queryClient.setQueryData(['students', filters], context.previousStudents);
            }
            showError('Failed to delete student');
        },
        onSuccess: () => {
            showSuccess('Student deleted successfully');
        },
        onSettled: () => {
            // Invalidate query to refetch fresh data
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });

    return {
        students: studentsQuery.data,
        isLoading: studentsQuery.isLoading,
        isError: studentsQuery.isError,
        error: studentsQuery.error,
        deleteStudent: deleteStudentMutation.mutate,
        isDeleting: deleteStudentMutation.isPending
    };
};
