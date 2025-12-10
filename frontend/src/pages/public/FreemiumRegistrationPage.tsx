import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { apiService } from '../../services/api';
import { schoolService } from '../../services/schoolService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

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
  const [codeValidation, setCodeValidation] = useState<{ isValidating: boolean, isValid: boolean, message: string }>({ isValidating: false, isValid: true, message: '' });
  const [emailValidation, setEmailValidation] = useState<{ isValidating: boolean, isValid: boolean, message: string }>({ isValidating: false, isValid: true, message: '' });
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
      setCodeValidation({ isValidating: false, isValid: false, message: 'School code must be at least 3 characters' });
      return;
    }

    setCodeValidation({ isValidating: true, isValid: true, message: 'Checking availability...' });

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
      setEmailValidation({ isValidating: false, isValid: true, message: '' });
      return;
    }

    setEmailValidation({ isValidating: true, isValid: true, message: 'Checking availability...' });

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

        admin_name: `${formData.admin_first_name} ${formData.admin_last_name}`.trim(),
        admin_email: formData.admin_email,
        admin_password: formData.admin_password,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        accent_color: formData.accent_color,
      };

      await apiService.post('/api/v1/schools/register', registrationData);

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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-scale-in">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                <CheckCircleIcon className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome Aboard!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Your school has been successfully registered. Get ready to transform your educational experience.
              </p>

              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 mb-8 text-left">
                <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100 uppercase tracking-wider mb-4">
                  Trial Benefits Unlocked
                </h3>
                <ul className="space-y-3">
                  {[
                    'Full access to all premium features',
                    'Unlimited student & teacher accounts',
                    'Advanced analytics dashboard',
                    'Priority customer support'
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-center text-sm text-primary-800 dark:text-primary-200">
                      <CheckCircleIcon className="h-5 w-5 mr-3 text-primary-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-500 animate-pulse">
                  Redirecting to your dashboard...
                </p>
                <Link
                  to={`/${formData.code}/login`}
                  className="block w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                >
                  Go to Dashboard Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      {/* Left Side - Hero */}
      <div className="lg:w-1/3 bg-primary-600 relative overflow-hidden hidden lg:flex flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-secondary-800 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center mix-blend-overlay"></div>

        <div className="relative z-10">
          <div className="flex justify-start mb-8 relative">
            <div className="absolute -left-10 -top-10 flex items-center justify-center">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-64 h-64 opacity-20 text-white fill-current animate-pulse-slow">
                <path d="M45.7,-76.3C58.9,-69.3,69.1,-56.3,77.1,-42.6C85.1,-28.9,90.9,-14.4,88.5,-0.8C86.1,12.8,75.5,25.6,65.1,36.2C54.7,46.8,44.5,55.2,33.1,61.6C21.7,68,9.1,72.4,-2.8,77.2C-14.7,82,-25.9,87.2,-36.8,84.4C-47.7,81.6,-58.3,70.8,-66.4,58.4C-74.5,46,-80.1,32,-81.9,17.6C-83.7,3.2,-81.7,-11.6,-74.6,-24.2C-67.5,-36.8,-55.3,-47.2,-42.9,-54.5C-30.5,-61.8,-17.9,-66,-4.8,-65.2" transform="translate(100 100)" />
              </svg>
            </div>
            <img
              src="/logo.png"
              alt="Edix"
              className="h-32 w-auto object-contain relative z-10"
            />
          </div>
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Start Your Digital Transformation
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed">
            Join thousands of forward-thinking schools managing their operations efficiently with our platform.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex -space-x-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-primary-600 bg-gray-300 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div>
              <p className="font-bold">2,000+ Schools</p>
              <p className="text-sm text-primary-200">Trust our platform</p>
            </div>
          </div>
          <p className="text-xs text-primary-300">
            &copy; {new Date().getFullYear()} Edix
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create your school account
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Get started with your 30-day free trial. No credit card required.
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10"></div>
              <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary-600 transition-all duration-500 -z-10`} style={{ width: `${((step - 1) / 2) * 100}%` }}></div>

              {[
                { num: 1, label: 'School Info', icon: BuildingOfficeIcon },
                { num: 2, label: 'Location', icon: MapPinIcon },
                { num: 3, label: 'Admin', icon: UserIcon }
              ].map((item) => (
                <div key={item.num} className="flex flex-col items-center bg-white dark:bg-gray-900 px-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= item.num
                      ? 'bg-primary-600 border-primary-600 text-white shadow-lg scale-110'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                      }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className={`mt-2 text-xs font-medium transition-colors duration-300 ${step >= item.num ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'
                    }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up">
            {/* Step 1: School Information */}
            {step === 1 && (
              <div className="space-y-6 animate-slide-in-right">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      School Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onBlur={generateSchoolCode}
                        className="input pl-10 py-3 rounded-xl"
                        placeholder="e.g. Springfield High School"
                        required
                      />
                      <BuildingOfficeIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      School Code <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className={`input py-3 rounded-xl ${!codeValidation.isValid && formData.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="e.g. SHS"
                        required
                      />
                      {codeValidation.isValidating && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <LoadingSpinner size="sm" />
                        </div>
                      )}
                      {!codeValidation.isValidating && codeValidation.isValid && formData.code && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    {codeValidation.message && (
                      <p className={`mt-1 text-xs ${codeValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                        {codeValidation.message}
                      </p>
                    )}
                  </div>



                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Official Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`input pl-10 py-3 rounded-xl ${!emailValidation.isValid && formData.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="admin@school.com"
                        required
                      />
                      <EnvelopeIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                      {emailValidation.isValidating && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <LoadingSpinner size="sm" />
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="input pl-10 py-3 rounded-xl"
                        placeholder="+234..."
                        required
                      />
                      <PhoneIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Website (Optional)
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="input py-3 rounded-xl"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location Information */}
            {step === 2 && (
              <div className="space-y-6 animate-slide-in-right">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleInputChange}
                      className="input py-3 rounded-xl"
                      placeholder="Street address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      name="address_line2"
                      value={formData.address_line2}
                      onChange={handleInputChange}
                      className="input py-3 rounded-xl"
                      placeholder="Apartment, suite, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="input py-3 rounded-xl"
                        placeholder="City"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="input py-3 rounded-xl"
                        placeholder="State"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Postal Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleInputChange}
                        className="input py-3 rounded-xl"
                        placeholder="Postal code"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="input py-3 rounded-xl"
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
              </div>
            )}

            {/* Step 3: Admin Account */}
            {step === 3 && (
              <div className="space-y-6 animate-slide-in-right">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <UserIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Admin Account</h3>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                        <p>This will be the super admin account with full access to manage the school.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="admin_first_name"
                      value={formData.admin_first_name}
                      onChange={handleInputChange}
                      className="input py-3 rounded-xl"
                      placeholder="First name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="admin_last_name"
                      value={formData.admin_last_name}
                      onChange={handleInputChange}
                      className="input py-3 rounded-xl"
                      placeholder="Last name"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admin Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="admin_email"
                        value={formData.admin_email}
                        onChange={handleInputChange}
                        className="input pl-10 py-3 rounded-xl"
                        placeholder="admin@school.com"
                        required
                      />
                      <EnvelopeIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="admin_password"
                      value={formData.admin_password}
                      onChange={handleInputChange}
                      className="input py-3 rounded-xl"
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    School Branding (Optional)
                  </h4>
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
                          className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-gray-500">{formData.primary_color}</span>
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
                          className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-gray-500">{formData.secondary_color}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                >
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-8 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
                onClick={step < 3 ? (e) => { e.preventDefault(); nextStep(); } : undefined}
              >
                {loading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : step < 3 ? (
                  <>
                    Next Step
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Complete Registration
                    <CheckCircleIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FreemiumRegistrationPage;
