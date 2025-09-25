import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BuildingOfficeIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { apiService } from '../../services/api';

interface FreemiumRegistration {
  // School Information
  name: string;
  code: string;
  email: string;
  phone: string;
  website?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  description?: string;
  motto?: string;
  established_year?: string;
  current_session: string;
  current_term: string;
  
  // Admin Information
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_password: string;
  admin_phone?: string;
  
  // Theme Settings
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}

const FreemiumRegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState<FreemiumRegistration>({
    // School Information
    name: '',
    code: '',
    email: '',
    phone: '',
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Nigeria',
    description: '',
    motto: '',
    established_year: '',
    current_session: '2024/2025',
    current_term: 'First Term',
    
    // Admin Information
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_password: '',
    admin_phone: '',
    
    // Theme Settings
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    accent_color: '#60A5FA'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [codeValidation, setCodeValidation] = useState<{isValidating: boolean, isValid: boolean, message: string}>({isValidating: false, isValid: true, message: ''});
  const [emailValidation, setEmailValidation] = useState<{isValidating: boolean, isValid: boolean, message: string}>({isValidating: false, isValid: true, message: ''});
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Trigger validation for school code
    if (name === 'code') {
      const debouncedValidation = setTimeout(() => {
        validateSchoolCode(value);
      }, 500);
      return () => clearTimeout(debouncedValidation);
    }

    // Trigger validation for school email
    if (name === 'email') {
      const debouncedValidation = setTimeout(() => {
        validateSchoolEmail(value);
      }, 500);
      return () => clearTimeout(debouncedValidation);
    }
  };

  const generateSchoolCode = () => {
    const name = formData.name.trim();
    if (name) {
      const code = name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 6);
      setFormData(prev => ({ ...prev, code }));
      // Validate the generated code
      if (code.length >= 3) {
        validateSchoolCode(code);
      }
    }
  };

  const validateSchoolCode = async (code: string) => {
    if (!code || code.length < 3) {
      setCodeValidation({isValidating: false, isValid: false, message: 'School code must be at least 3 characters'});
      return;
    }

    setCodeValidation({isValidating: true, isValid: true, message: 'Checking availability...'});
    
    try {
      const response = await schoolService.validateSchoolCodeAvailability(code);
      setCodeValidation({
        isValidating: false,
        isValid: response.available,
        message: response.message
      });
    } catch (error) {
      setCodeValidation({
        isValidating: false,
        isValid: false,
        message: 'Error checking code availability'
      });
    }
  };

  const validateSchoolEmail = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailValidation({isValidating: false, isValid: true, message: ''});
      return;
    }

    setEmailValidation({isValidating: true, isValid: true, message: 'Checking availability...'});
    
    try {
      const response = await schoolService.validateSchoolEmailAvailability(email);
      setEmailValidation({
        isValidating: false,
        isValid: response.available,
        message: response.message
      });
    } catch (error) {
      setEmailValidation({
        isValidating: false,
        isValid: false,
        message: 'Error checking email availability'
      });
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(formData.name && formData.code && formData.email && formData.phone) && 
               codeValidation.isValid && !codeValidation.isValidating &&
               emailValidation.isValid && !emailValidation.isValidating;
      case 2:
        return !!(formData.address_line1 && formData.city && formData.state && formData.postal_code);
      case 3:
        return !!(formData.admin_first_name && formData.admin_last_name && formData.admin_email && formData.admin_password);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      showError('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) {
      showError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Transform formData to match FreemiumRegistration backend schema
      const registrationData = {
        school_name: formData.name,
        school_code: formData.code,
        email: formData.email,
        phone: formData.phone,
        address: formData.address_line1,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code,
        current_session: formData.current_session,
        current_term: formData.current_term,
        admin_name: `${formData.admin_first_name} ${formData.admin_last_name}`.trim(),
        admin_email: formData.admin_email,
        admin_password: formData.admin_password,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        accent_color: formData.accent_color,
      };

      const response = await apiService.post('/api/v1/schools/register', registrationData);
      
      setSubmitted(true);
      showSuccess('School registered successfully! Your 30-day free trial has started.');
      
      // Redirect to school-specific login after a short delay
      setTimeout(() => {
        navigate(`/${formData.code}/login`, { 
          state: { 
            message: 'Registration successful! Please login with your credentials.',
            email: formData.admin_email 
          }
        });
      }, 3000);
      
    } catch (error: any) {
      console.error('Registration error:', error);

      let errorMessage = 'Failed to register school';

      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          // Handle Pydantic validation errors
          const validationErrors = error.response.data.detail.map((err: any) => {
            if (err.loc && err.msg) {
              const field = err.loc.join('.');
              return `${field}: ${err.msg}`;
            }
            return err.msg || err;
          }).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to Your Free Trial!
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Your school has been successfully registered. You now have 30 days of full access to all features.
              </p>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  🎉 Trial Benefits
                </h3>
                <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Up to 100 students</li>
                  <li>• Up to 10 teachers</li>
                  <li>• Up to 20 classes</li>
                  <li>• All premium features included</li>
                  <li>• Full customer support</li>
                </ul>
              </div>
              <div className="mt-6">
                <Link
                  to="/login"
                  className="btn btn-primary"
                >
                  Login to Your Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Header */}
        <div className="text-center">
          <SparklesIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Start Your Free 30-Day Trial
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Get instant access to all premium features. No credit card required.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }
                `}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>School Info</span>
            <span>Location</span>
            <span>Admin Account</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: School Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  School Information
                </h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      School Name *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onBlur={generateSchoolCode}
                        className="input pl-10"
                        placeholder="Enter your school name"
                        required
                      />
                      <BuildingOfficeIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      School Code *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className={`input ${!codeValidation.isValid && formData.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="e.g., ABCHS"
                        required
                      />
                      {codeValidation.isValidating && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      {!codeValidation.isValidating && codeValidation.isValid && formData.code && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {!codeValidation.isValidating && !codeValidation.isValid && formData.code && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {codeValidation.message && (
                      <p className={`mt-1 text-xs ${codeValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                        {codeValidation.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Unique identifier for your school (3-20 characters, letters, numbers, hyphens, underscores)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Session *
                    </label>
                    <select
                      name="current_session"
                      value={formData.current_session}
                      onChange={handleInputChange}
                      className="input mt-1"
                      required
                    >
                      <option value="2024/2025">2024/2025</option>
                      <option value="2023/2024">2023/2024</option>
                      <option value="2025/2026">2025/2026</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`input pl-10 ${!emailValidation.isValid && formData.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="school@example.com"
                        required
                      />
                      <EnvelopeIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      {emailValidation.isValidating && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      {!emailValidation.isValidating && emailValidation.isValid && formData.email && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {!emailValidation.isValidating && !emailValidation.isValid && formData.email && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {emailValidation.message && (
                      <p className={`mt-1 text-xs ${emailValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                        {emailValidation.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="input pl-10"
                        placeholder="+234 123 456 7890"
                        required
                      />
                      <PhoneIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Website (Optional)
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="input mt-1"
                      placeholder="https://yourschool.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-primary flex items-center"
                  >
                    Next Step
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Location Information */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  School Location
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleInputChange}
                      className="input mt-1"
                      placeholder="Street address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      name="address_line2"
                      value={formData.address_line2}
                      onChange={handleInputChange}
                      className="input mt-1"
                      placeholder="Apartment, suite, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="input mt-1"
                        placeholder="City"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="input mt-1"
                        placeholder="State"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleInputChange}
                        className="input mt-1"
                        placeholder="Postal code"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Country *
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="input mt-1"
                      required
                    >
                      <option value="Nigeria">Nigeria</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Kenya">Kenya</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn btn-secondary flex items-center"
                  >
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-primary flex items-center"
                  >
                    Next Step
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Admin Account */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Create Admin Account
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        name="admin_first_name"
                        value={formData.admin_first_name}
                        onChange={handleInputChange}
                        className="input pl-10"
                        placeholder="First name"
                        required
                      />
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="admin_last_name"
                      value={formData.admin_last_name}
                      onChange={handleInputChange}
                      className="input mt-1"
                      placeholder="Last name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="email"
                        name="admin_email"
                        value={formData.admin_email}
                        onChange={handleInputChange}
                        className="input pl-10"
                        placeholder="admin@school.com"
                        required
                      />
                      <EnvelopeIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number (Optional)
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="tel"
                        name="admin_phone"
                        value={formData.admin_phone}
                        onChange={handleInputChange}
                        className="input pl-10"
                        placeholder="+234 123 456 7890"
                      />
                      <PhoneIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="admin_password"
                      value={formData.admin_password}
                      onChange={handleInputChange}
                      className="input mt-1"
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This will be your login password for the admin dashboard
                    </p>
                  </div>
                </div>

                {/* Theme Color Selection */}
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    School Branding Colors (Optional)
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Customize your school's login page with your brand colors
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          name="primary_color"
                          value={formData.primary_color}
                          onChange={handleInputChange}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.primary_color}
                          onChange={handleInputChange}
                          name="primary_color"
                          className="input text-xs font-mono"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          name="secondary_color"
                          value={formData.secondary_color}
                          onChange={handleInputChange}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.secondary_color}
                          onChange={handleInputChange}
                          name="secondary_color"
                          className="input text-xs font-mono"
                          placeholder="#1E40AF"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Accent Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          name="accent_color"
                          value={formData.accent_color}
                          onChange={handleInputChange}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.accent_color}
                          onChange={handleInputChange}
                          name="accent_color"
                          className="input text-xs font-mono"
                          placeholder="#60A5FA"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Color Preview */}
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                    <div 
                      className="h-8 rounded flex items-center justify-center text-white font-medium text-sm"
                      style={{ backgroundColor: formData.primary_color }}
                    >
                      {formData.name || 'Your School Name'}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This is how your school name will appear on the login page
                    </p>
                  </div>
                </div>

                {/* Trial Benefits Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🎉 Your 30-Day Free Trial Includes:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
                    <div>• Up to 100 students</div>
                    <div>• Up to 10 teachers</div>
                    <div>• Up to 20 classes</div>
                    <div>• All premium features</div>
                    <div>• Student management</div>
                    <div>• Grade tracking</div>
                    <div>• Fee management</div>
                    <div>• Communication tools</div>
                    <div>• Reports & analytics</div>
                    <div>• Full customer support</div>
                  </div>
                  <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                    No credit card required. Cancel anytime during trial.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn btn-secondary flex items-center"
                  >
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Start Free Trial
                        <SparklesIcon className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FreemiumRegistrationPage;
