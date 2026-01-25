import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import {
    UserIcon,
    EnvelopeIcon,
    LockClosedIcon,
    EyeIcon,
    EyeSlashIcon,
    BuildingOfficeIcon,
    UserGroupIcon,
    PhoneIcon
} from '@heroicons/react/24/outline';

const Register = () => {
    const { register: authRegister } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [userType, setUserType] = useState('customer');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const password = watch('password', '');

    const onSubmit = async (data) => {
        try {
            setIsLoading(true);
            setError('');

            const registerData = {
                email: data.email,
                password: data.password,
                first_name: data.first_name,
                last_name: data.last_name,
                phone_number: data.phone_number || '',
                user_type: userType,
            };

            if (userType === 'business_owner' && data.business_name) {
                registerData.business_name = data.business_name;
            }

            const result = await authRegister(registerData);

            if (result.success) {
                alert('Registration successful!');
                if (userType === 'business_owner') {
                    navigate('/dashboard', { replace: true });
                } else {
                    navigate('/services', { replace: true });
                }
            } else {
                setError(result.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            setError('An error occurred during registration. Please try again.');
            console.error('Registration error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header - FIXED: Added explicit text colors */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-white/20 p-3 rounded-full">
                                <UserIcon className="h-12 w-12 text-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white">
                            Create your account
                        </h2>
                        <p className="text-white/90 mt-2">
                            Join Reserva to book services or grow your business
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 sm:p-8">
                        {/* User Type Selection */}
                        <div className="mb-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                                <h3 className="text-sm font-medium text-gray-900">I want to:</h3>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setUserType('customer')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${userType === 'customer'
                                            ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                                            }`}
                                    >
                                        Book Services
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUserType('business_owner')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${userType === 'business_owner'
                                            ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                                            }`}
                                    >
                                        Grow My Business
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                                {userType === 'business_owner' ? (
                                    <>
                                        <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Business Owner Account</p>
                                            <p className="text-xs text-gray-600">Manage appointments, services, and employees</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <UserGroupIcon className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Customer Account</p>
                                            <p className="text-xs text-gray-600">Book services and manage appointments</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            {error && (
                                <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
                                    <div className="flex items-center">
                                        <svg className="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="text-sm font-medium text-red-700">{error}</div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* First Name */}
                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-900 mb-2">
                                        First Name
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            id="first_name"
                                            type="text"
                                            {...register('first_name', {
                                                required: 'First name is required',
                                                minLength: {
                                                    value: 2,
                                                    message: 'First name must be at least 2 characters',
                                                },
                                            })}
                                            className="block w-full pl-10 pr-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500"
                                            placeholder="Enter your first name"
                                        />
                                    </div>
                                    {errors.first_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-900 mb-2">
                                        Last Name
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            id="last_name"
                                            type="text"
                                            {...register('last_name', {
                                                required: 'Last name is required',
                                                minLength: {
                                                    value: 2,
                                                    message: 'Last name must be at least 2 characters',
                                                },
                                            })}
                                            className="block w-full pl-10 pr-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500"
                                            placeholder="Enter your last name"
                                        />
                                    </div>
                                    {errors.last_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="md:col-span-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            id="email"
                                            type="email"
                                            {...register('email', {
                                                required: 'Email is required',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: 'Invalid email address',
                                                },
                                            })}
                                            className="block w-full pl-10 pr-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                    )}
                                </div>

                                {/* Phone Number - Optional */}
                                <div className="md:col-span-2">
                                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-900 mb-2">
                                        Phone Number <span className="text-gray-500 text-sm">(Optional)</span>
                                    </label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            id="phone_number"
                                            type="tel"
                                            {...register('phone_number', {
                                                pattern: {
                                                    value: /^[+]?[\d\s\-()]+$/,
                                                    message: 'Invalid phone number format',
                                                },
                                            })}
                                            className="block w-full pl-10 pr-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                    {errors.phone_number && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                                    )}
                                </div>

                                {/* Business Name - Conditional for Business Owners */}
                                {userType === 'business_owner' && (
                                    <div className="md:col-span-2">
                                        <label htmlFor="business_name" className="block text-sm font-medium text-gray-900 mb-2">
                                            Business Name
                                        </label>
                                        <div className="relative">
                                            <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                id="business_name"
                                                type="text"
                                                {...register('business_name', {
                                                    required: userType === 'business_owner' ? 'Business name is required' : false,
                                                    minLength: {
                                                        value: 2,
                                                        message: 'Business name must be at least 2 characters',
                                                    },
                                                })}
                                                className="block w-full pl-10 pr-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500"
                                                placeholder="Enter your business name"
                                            />
                                        </div>
                                        {errors.business_name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>
                                        )}
                                    </div>
                                )}

                                {/* Password */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            {...register('password', {
                                                required: 'Password is required',
                                                minLength: {
                                                    value: 8,
                                                    message: 'Password must be at least 8 characters',
                                                },
                                                pattern: {
                                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                                                },
                                            })}
                                            className="block w-full pl-10 pr-10 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500"
                                            placeholder="Create a password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Must be at least 8 characters with uppercase, lowercase, and a number
                                    </p>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-900 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            id="confirm_password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            {...register('confirm_password', {
                                                required: 'Please confirm your password',
                                                validate: value => value === password || 'Passwords do not match',
                                            })}
                                            className="block w-full pl-10 pr-10 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500"
                                            placeholder="Confirm your password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.confirm_password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Terms and Conditions */}
                            <div className="flex items-start bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        {...register('terms', {
                                            required: 'You must accept the terms and conditions',
                                        })}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="ml-3">
                                    <label htmlFor="terms" className="text-sm font-medium text-gray-900">
                                        I agree to the{' '}
                                        <Link to="/terms" className="text-indigo-600 hover:text-indigo-500 font-medium">
                                            Terms of Service
                                        </Link>{' '}
                                        and{' '}
                                        <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500 font-medium">
                                            Privacy Policy
                                        </Link>
                                    </label>
                                    {errors.terms && (
                                        <p className="mt-1 text-sm text-red-600 font-medium">{errors.terms.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Newsletter */}
                            <div className="flex items-start bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center h-5">
                                    <input
                                        id="newsletter"
                                        type="checkbox"
                                        {...register('newsletter')}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="ml-3">
                                    <label htmlFor="newsletter" className="text-sm text-gray-900">
                                        Subscribe to our newsletter for updates and offers
                                    </label>
                                </div>
                            </div>

                            {/* Submit Button - FIXED: Added explicit text-white class */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-bold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center text-white">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Creating account...
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-white">
                                            <UserIcon className="h-5 w-5 mr-2" />
                                            {`Create ${userType === 'business_owner' ? 'Business' : 'Customer'} Account`}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Already have account */}
                            <div className="text-center pt-4 border-t border-gray-200">
                                <p className="text-gray-600">
                                    Already have an account?{' '}
                                    <Link
                                        to="/login"
                                        className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                                    >
                                        Sign in here
                                    </Link>
                                </p>
                            </div>
                        </form>

                        {/* Demo Accounts Info */}
                        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <div className="flex items-center mb-2">
                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h4 className="text-sm font-bold text-blue-800">Demo Accounts</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <p className="text-blue-700">
                                    <span className="font-semibold">Customer:</span> customer@example.com / Password123
                                </p>
                                <p className="text-blue-700">
                                    <span className="font-semibold">Business:</span> business@example.com / Password123
                                </p>
                                <p className="text-xs text-blue-600 italic">Feel free to use these for testing!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;