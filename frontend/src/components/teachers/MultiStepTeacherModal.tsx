import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { 
  CreateTeacherForm, 
  Teacher,
  Gender
} from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { apiService } from '../../services/api';
import BasicInfoStep from './steps/BasicInfoStep';
import ProfessionalInfoStep from './steps/ProfessionalInfoStep';
import AddressInfoStep from './steps/AddressInfoStep';
import SubjectAssignmentStep from './steps/SubjectAssignmentStep';

interface MultiStepTeacherModalProps {
  teacher?: Teacher | null;
  onClose: () => void;
  onSave: () => void;
}

const STEPS = [
  { id: 'basic', title: 'Basic Information', description: 'Personal details' },
  { id: 'professional', title: 'Professional Info', description: 'Work details' },
  { id: 'address', title: 'Address', description: 'Contact information' },
  { id: 'subjects', title: 'Subject Assignment', description: 'Teaching subjects' },
];

const MultiStepTeacherModal: React.FC<MultiStepTeacherModalProps> = ({ 
  teacher, 
  onClose, 
  onSave 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showSuccess, showError } = useToast();

  // Form data state for all steps
  const [formData, setFormData] = useState<Partial<CreateTeacherForm>>({
    gender: 'male' as Gender,
    // Initialize required fields with empty strings to avoid undefined issues
    first_name: '',
    last_name: '',
    email: '',
    employee_id: '',
    department: '',
    position: '',
    password: '',
  });

  // Initialize form data if editing
  useEffect(() => {
    if (teacher) {
      const loadTeacherData = async () => {
        try {
          // Load basic teacher info
          const basicData = {
            first_name: teacher.user.first_name,
            last_name: teacher.user.last_name,
            middle_name: teacher.user.middle_name || '',
            email: teacher.user.email,
            phone: teacher.user.phone || '',
            date_of_birth: teacher.user.date_of_birth ? teacher.user.date_of_birth.toString().split('T')[0] : '',
            gender: teacher.user.gender as Gender || 'male',
            employee_id: teacher.employee_id,
            department: teacher.department || '',
            position: teacher.user.position || '',
            qualification: teacher.user.qualification || '',
            experience_years: teacher.user.experience_years || '',
            address_line1: teacher.user.address_line1 || '',
            address_line2: teacher.user.address_line2 || '',
            city: teacher.user.city || '',
            state: teacher.user.state || '',
            postal_code: teacher.user.postal_code || '',
            bio: teacher.user.bio || '',
            // Don't include password for editing
          };

          // Load teacher's current subject assignments
          try {
            const assignments = await apiService.get(`/api/v1/assignments/teachers/${teacher.user.id}/subjects`);
            const subjectIds = assignments.map((a: any) => a.subject_id);
            const headOfSubject = assignments.find((a: any) => a.is_head_of_subject);

            basicData.subject_ids = subjectIds;
            basicData.head_of_subject_id = headOfSubject?.subject_id || '';
          } catch (error) {
            console.error('Failed to load teacher subjects:', error);
            // Continue without subject data if loading fails
          }

          setFormData(basicData);
        } catch (error) {
          console.error('Failed to load teacher data:', error);
        }
      };

      loadTeacherData();
    }
  }, [teacher]);

  const updateFormData = (stepData: Partial<CreateTeacherForm>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate required fields (password is optional since we auto-generate it)
      // For staff creation, employee_id, department, and position are required by backend
      const requiredFields = ['first_name', 'last_name', 'email', 'employee_id', 'department', 'position'];

      const missingFields = requiredFields.filter(field => !formData[field as keyof CreateTeacherForm]);

      if (missingFields.length > 0) {
        showError(`Please fill in required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Generate password for new teachers using email and first name
      let generatedPassword = '';
      if (!teacher && formData.email && formData.first_name) {
        // Use email prefix + first name as password
        const emailPrefix = formData.email.split('@')[0];
        generatedPassword = `${emailPrefix}${formData.first_name}`;

        // Ensure password is at least 8 characters (backend requirement)
        if (generatedPassword.length < 8) {
          generatedPassword = generatedPassword + '123'; // Add numbers to meet minimum length
        }
      }

      // Prepare data for submission - ensure required fields have values
      const submitData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: 'teacher',
        // Use generated password for new teachers
        password: teacher ? undefined : (formData.password || generatedPassword),
        // Required fields for StaffCreate - provide defaults if empty
        employee_id: formData.employee_id || `TCH${Date.now()}`,
        department: formData.department || 'General',
        position: formData.position || 'Teacher',
      };

      // Add optional fields only if they have values
      if (formData.middle_name) submitData.middle_name = formData.middle_name;
      if (formData.phone) submitData.phone = formData.phone;
      if (formData.date_of_birth) submitData.date_of_birth = formData.date_of_birth;
      if (formData.gender) submitData.gender = formData.gender;
      if (formData.qualification) submitData.qualification = formData.qualification;
      if (formData.experience_years) submitData.experience_years = formData.experience_years;
      if (formData.address_line1) submitData.address_line1 = formData.address_line1;
      if (formData.address_line2) submitData.address_line2 = formData.address_line2;
      if (formData.city) submitData.city = formData.city;
      if (formData.state) submitData.state = formData.state;
      if (formData.postal_code) submitData.postal_code = formData.postal_code;
      if (formData.bio) submitData.bio = formData.bio;

      // Add subject assignments for new teachers
      if (!teacher) {
        if (formData.subject_ids && formData.subject_ids.length > 0) {
          submitData.subject_ids = formData.subject_ids;
        }
        if (formData.head_of_subject_id) {
          submitData.head_of_subject_id = formData.head_of_subject_id;
        }
      }

      // Remove password field if editing
      if (teacher) {
        delete submitData.password;
      }

      // Debug: Log the data being sent
      console.log('Submitting teacher data:', JSON.stringify(submitData, null, 2));

      // Make API call to create/update teacher using apiService
      let response;
      if (teacher) {
        // For existing teachers, update basic info first
        response = await apiService.put(`/api/v1/users/${teacher.user.id}`, submitData);

        // Then handle subject assignments separately if they were modified
        if (formData.subject_ids !== undefined || formData.head_of_subject_id !== undefined) {
          const subjectAssignmentData = {
            teacher_id: teacher.user.id,
            subject_ids: formData.subject_ids || [],
            head_of_subject_id: formData.head_of_subject_id || undefined
          };

          // Use the bulk assignment endpoint to update teacher subjects
          await apiService.post(`/api/v1/assignments/teachers/${teacher.user.id}/subjects/bulk`, subjectAssignmentData);
        }
      } else {
        // Use the new teacher creation endpoint that supports subject assignments
        response = await apiService.post('/api/v1/users/teachers', submitData);
      }

      if (teacher) {
        showSuccess('Teacher updated successfully');
      } else {
        showSuccess(`Teacher created successfully. Login credentials: Email: ${formData.email}, Password: ${generatedPassword || formData.password}`);
      }
      onSave();
    } catch (error: any) {
      console.error('Failed to save teacher:', error);

      // Extract detailed error message from response
      let errorMessage = 'Failed to save teacher';

      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          // Handle validation errors array
          const validationErrors = error.response.data.detail.map((err: any) => {
            if (err.loc && err.msg) {
              return `${err.loc.join('.')}: ${err.msg}`;
            }
            return err.msg || err;
          }).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('employee_id') || errorMessage.toLowerCase().includes('employee id already exists')) {
        showError('This employee ID is already taken. Please use a different employee ID.');
      } else if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('email already exists')) {
        showError('This email address is already registered in this school. Please use a different email address.');
      } else {
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'basic':
        return (
          <BasicInfoStep 
            data={formData} 
            onUpdate={updateFormData}
            isEdit={!!teacher}
          />
        );
      case 'professional':
        return (
          <ProfessionalInfoStep 
            data={formData} 
            onUpdate={updateFormData} 
          />
        );
      case 'address':
        return (
          <AddressInfoStep
            data={formData}
            onUpdate={updateFormData}
          />
        );
      case 'subjects':
        return (
          <SubjectAssignmentStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    {teacher ? 'Edit Teacher' : 'Add New Teacher'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Step Progress */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => (
                      <div
                        key={step.id}
                        className={`flex flex-col items-center ${
                          index <= currentStep ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            index <= currentStep
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="mt-2 text-xs text-center">
                          <div className="font-medium">{step.title}</div>
                          <div className="text-gray-500 dark:text-gray-400">{step.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                  {renderStepContent()}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-2" />
                    Previous
                  </button>

                  {currentStep === STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="btn-primary flex items-center"
                    >
                      {loading && <LoadingSpinner size="sm" className="mr-2" />}
                      {teacher ? 'Update Teacher' : 'Create Teacher'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="btn-primary flex items-center"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4 ml-2" />
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MultiStepTeacherModal;
