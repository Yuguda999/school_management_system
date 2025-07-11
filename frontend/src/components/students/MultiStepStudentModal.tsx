import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { 
  CreateStudentForm, 
  StudentBasicInfoForm,
  StudentAddressForm,
  StudentParentForm,
  StudentEmergencyContactForm,
  StudentMedicalForm,
  StudentAcademicForm,
  Student,
  Class,
  Gender
} from '../../types';
import { studentService } from '../../services/studentService';
import { academicService } from '../../services/academicService';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import BasicInfoStep from './steps/BasicInfoStep';
import AddressStep from './steps/AddressStep';
import ParentStep from './steps/ParentStep';
import EmergencyContactStep from './steps/EmergencyContactStep';
import MedicalStep from './steps/MedicalStep';
import AcademicStep from './steps/AcademicStep';

interface MultiStepStudentModalProps {
  student?: Student | null;
  onClose: () => void;
  onSave: () => void;
}

const STEPS = [
  { id: 'basic', title: 'Basic Information', description: 'Personal details' },
  { id: 'address', title: 'Address', description: 'Contact information' },
  { id: 'parent', title: 'Parent/Guardian', description: 'Guardian details' },
  { id: 'emergency', title: 'Emergency Contact', description: 'Emergency information' },
  { id: 'medical', title: 'Medical Information', description: 'Health details' },
  { id: 'academic', title: 'Academic Information', description: 'School details' },
];

const MultiStepStudentModal: React.FC<MultiStepStudentModalProps> = ({ 
  student, 
  onClose, 
  onSave 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const { showSuccess, showError } = useToast();

  // Form data state for all steps
  const [formData, setFormData] = useState<Partial<CreateStudentForm>>({
    admission_date: new Date().toISOString().split('T')[0],
    gender: 'male' as Gender,
    // Initialize required fields with empty strings to avoid undefined issues
    admission_number: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    address_line1: '',
    city: '',
    state: '',
    postal_code: '',
  });

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      const classesData = await academicService.getClasses({ is_active: true });
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to load classes:', error);
      showError('Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  // Initialize form data if editing
  useEffect(() => {
    if (student) {
      setFormData({
        admission_number: student.admission_number || '',
        first_name: student.first_name,
        last_name: student.last_name,
        middle_name: student.middle_name || '',
        date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : '',
        gender: student.gender as Gender,
        phone: student.phone || '',
        email: student.email || '',
        address_line1: student.address_line1 || '',
        address_line2: student.address_line2 || '',
        city: student.city || '',
        state: student.state || '',
        postal_code: student.postal_code || '',
        admission_date: student.admission_date ? student.admission_date.split('T')[0] : new Date().toISOString().split('T')[0],
        current_class_id: student.current_class_id || '',
        guardian_name: student.guardian_name || '',
        guardian_phone: student.guardian_phone || '',
        guardian_email: student.guardian_email || '',
        guardian_relationship: student.guardian_relationship || '',
        emergency_contact_name: student.emergency_contact_name || '',
        emergency_contact_phone: student.emergency_contact_phone || '',
        emergency_contact_relationship: student.emergency_contact_relationship || '',
        medical_conditions: student.medical_conditions || '',
        allergies: student.allergies || '',
        blood_group: student.blood_group || '',
        notes: student.notes || '',
      });
    }
  }, [student]);

  const updateFormData = (stepData: Partial<CreateStudentForm>) => {
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
      // Validate required fields
      const requiredFields = [
        'admission_number', 'first_name', 'last_name', 'date_of_birth',
        'gender', 'address_line1', 'city', 'state', 'postal_code', 'admission_date'
      ];

      const missingFields = requiredFields.filter(field => !formData[field as keyof CreateStudentForm]);

      if (missingFields.length > 0) {
        showError(`Please fill in required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Prepare data for submission - clean up empty strings for optional fields
      const submitData = {
        ...formData,
        // Ensure dates are in the correct format (YYYY-MM-DD)
        date_of_birth: formData.date_of_birth,
        admission_date: formData.admission_date,
        // Convert empty strings to undefined for optional fields
        middle_name: formData.middle_name || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address_line2: formData.address_line2 || undefined,
        current_class_id: formData.current_class_id || undefined,
        parent_id: formData.parent_id || undefined,
        guardian_name: formData.guardian_name || undefined,
        guardian_phone: formData.guardian_phone || undefined,
        guardian_email: formData.guardian_email || undefined,
        guardian_relationship: formData.guardian_relationship || undefined,
        emergency_contact_name: formData.emergency_contact_name || undefined,
        emergency_contact_phone: formData.emergency_contact_phone || undefined,
        emergency_contact_relationship: formData.emergency_contact_relationship || undefined,
        medical_conditions: formData.medical_conditions || undefined,
        allergies: formData.allergies || undefined,
        blood_group: formData.blood_group || undefined,
        notes: formData.notes || undefined,
      } as CreateStudentForm;



      if (student) {
        await studentService.updateStudent(student.id, submitData);
        showSuccess('Student updated successfully');
      } else {
        await studentService.createStudent(submitData);
        showSuccess('Student created successfully');
      }
      onSave();
    } catch (error: any) {
      console.error('Failed to save student:', error);

      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorDetail = error.response?.data?.detail;

        if (typeof errorDetail === 'string' && errorDetail.toLowerCase().includes('admission number already exists')) {
          showError('This admission number is already taken. Please use a different admission number.');
        } else if (typeof errorDetail === 'string' && errorDetail.toLowerCase().includes('admission number')) {
          showError('Admission number error: ' + errorDetail);
        } else {
          showError(errorDetail || 'Bad request - please check your input data');
        }
      } else if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.detail;
        if (Array.isArray(validationErrors)) {
          const errorMessages = validationErrors.map((err: any) =>
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ');
          showError(`Validation error: ${errorMessages}`);
        } else {
          showError('Please check your input data for errors');
        }
      } else {
        showError(error.response?.data?.detail || error.message || 'Failed to save student');
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
            isEdit={!!student}
          />
        );
      case 'address':
        return (
          <AddressStep 
            data={formData} 
            onUpdate={updateFormData} 
          />
        );
      case 'parent':
        return (
          <ParentStep 
            data={formData} 
            onUpdate={updateFormData} 
          />
        );
      case 'emergency':
        return (
          <EmergencyContactStep 
            data={formData} 
            onUpdate={updateFormData} 
          />
        );
      case 'medical':
        return (
          <MedicalStep 
            data={formData} 
            onUpdate={updateFormData} 
          />
        );
      case 'academic':
        return (
          <AcademicStep 
            data={formData} 
            onUpdate={updateFormData}
            classes={classes}
            loadingClasses={loadingClasses}
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
                    {student ? 'Edit Student' : 'Add New Student'}
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
                      {student ? 'Update Student' : 'Create Student'}
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

export default MultiStepStudentModal;
