import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
  ArrowRightIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Hero3D from '../../components/landing/Hero3D';

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      name: 'Student Management',
      description: 'Complete student information system with enrollment, attendance, and academic records.',
      icon: AcademicCapIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'AI-Powered Insights',
      description: 'Leverage artificial intelligence to predict student performance and identify at-risk students.',
      icon: SparklesIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Advanced Analytics',
      description: 'Deep dive into school data with interactive dashboards and comprehensive reports.',
      icon: ChartBarIcon,
      color: 'bg-indigo-500',
    },
    {
      name: 'Fee Management',
      description: 'Automated fee collection, payment tracking, and financial reporting made simple.',
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Communication',
      description: 'Integrated messaging to keep parents, students, and staff connected.',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-pink-500',
    },
    {
      name: 'Mobile First',
      description: 'Access Edix from any device, anywhere, anytime.',
      icon: DevicePhoneMobileIcon,
      color: 'bg-teal-500',
    },
    {
      name: 'Blockchain Identity',
      description: 'Issue verifiable, tamper-proof credentials on the Cardano blockchain.',
      icon: ShieldCheckIcon,
      color: 'bg-orange-500',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$29',
      period: 'month',
      description: 'Essential tools for small schools',
      features: [
        'Up to 100 students',
        'Up to 10 teachers',
        'Basic reporting',
        'Email support',
        'Student attendance',
      ],
      cta: 'Start Free Trial',
      href: '/register',
      popular: false,
    },
    {
      name: 'Growth',
      price: '$79',
      period: 'month',
      description: 'Perfect for growing institutions',
      features: [
        'Up to 500 students',
        'Up to 50 teachers',
        'Advanced analytics',
        'Priority support',
        'Fee management',
        'Parent portal',
      ],
      cta: 'Get Started',
      href: '/register',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large schools & districts',
      features: [
        'Unlimited students',
        'Unlimited teachers',
        'Custom integrations',
        'Dedicated account manager',
        'White-labeling',
        'SLA guarantee',
      ],
      cta: 'Contact Sales',
      href: '/contact',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans selection:bg-primary-500 selection:text-white">

      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Edix" className="h-10 w-auto" />
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Pricing</a>
            <Link to="/verify" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center">
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
              Verify Credential
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <Hero3D />
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary-500/10 rounded-full blur-3xl animate-float delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-8 leading-tight animate-fade-in-up delay-100">
            The Intelligent Way to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
              Manage Your School
            </span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300 mb-10 animate-fade-in-up delay-200">
            Empower your institution with AI-driven insights, blockchain-secured credentials, and seamless administration. The future of education management is here.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-300">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30 hover:shadow-primary-600/50 hover:-translate-y-1"
            >
              Start Free Trial
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:-translate-y-1"
            >
              View Demo
            </Link>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl animate-fade-in-up delay-500">
            <div className="rounded-3xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-4xl lg:p-4">
              <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-gray-900/10 overflow-hidden">
                {/* Placeholder for a dashboard screenshot - using a gradient for now */}
                <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1584697964358-3e14ca57658b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>
                  <div className="text-center p-10">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white dark:bg-gray-800 py-12 border-y border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Schools', value: '500+' },
              { label: 'Students', value: '50k+' },
              { label: 'Teachers', value: '2,500+' },
              { label: 'Countries', value: '15+' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI & Analytics Showcase */}
      <div className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary-600/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Unlock the Power of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
                  AI-Driven Insights
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Go beyond basic reporting. Edix uses advanced artificial intelligence to analyze student performance trends, predict potential learning gaps, and provide actionable recommendations for teachers and administrators.
              </p>

              <ul className="space-y-4 mb-10">
                {[
                  'Predictive performance modeling',
                  'At-risk student identification',
                  'Personalized learning path recommendations',
                  'Automated administrative insights'
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-200">
                    <div className="h-6 w-6 rounded-full bg-primary-500/30 flex items-center justify-center mr-3">
                      <CheckIcon className="h-4 w-4 text-primary-300" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 text-lg font-bold rounded-2xl bg-white text-gray-900 hover:bg-gray-100 transition-all shadow-lg hover:-translate-y-1"
              >
                Try AI Features
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl blur-2xl opacity-30 transform rotate-3"></div>
              <div className="relative bg-gray-800 border border-gray-700 rounded-3xl p-6 shadow-2xl">
                {/* Abstract representation of AI Analytics UI */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="h-4 w-32 bg-gray-600 rounded mb-2"></div>
                      <div className="h-3 w-24 bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                      <SparklesIcon className="h-6 w-6 text-primary-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-gray-700/50 rounded-xl p-4">
                        <div className="h-8 w-8 rounded-full bg-gray-600 mb-3"></div>
                        <div className="h-3 w-16 bg-gray-600 rounded mb-2"></div>
                        <div className="h-5 w-12 bg-primary-500/40 rounded"></div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <div className="flex items-center mb-4">
                      <div className="h-3 w-3 rounded-full bg-green-400 mr-2"></div>
                      <div className="h-3 w-40 bg-gray-600 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Performance Trend</span>
                        <span>+12% vs Last Term</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Identity Showcase */}
      <div className="py-24 bg-white dark:bg-gray-800 relative overflow-hidden border-t border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-l from-primary-500 to-secondary-500 rounded-3xl blur-2xl opacity-20 transform -rotate-3"></div>
              <div className="relative bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-2xl">
                {/* Abstract representation of Blockchain Credential */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <AcademicCapIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded"></div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                      Verified
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
                    <div className="h-3 w-5/6 bg-gray-100 dark:bg-gray-800 rounded"></div>
                    <div className="h-3 w-4/6 bg-gray-100 dark:bg-gray-800 rounded"></div>
                  </div>

                  <div className="pt-6 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 mr-1 text-primary-500" />
                      Secured on Cardano
                    </div>
                    <div className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      0x7f...3a9
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Sovereign Student <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                  Identity & Credentials
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Issue tamper-proof, verifiable academic credentials that students own forever. Powered by the Cardano blockchain, Edix ensures that diplomas and transcripts are instantly verifiable and impossible to forge.
              </p>

              <ul className="space-y-4 mb-10">
                {[
                  'Tamper-proof academic records',
                  'Instant global verification',
                  'Student-owned digital identity',
                  'Zero-knowledge privacy protection'
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3">
                      <CheckIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/verify"
                className="inline-flex items-center px-8 py-4 text-lg font-bold rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:-translate-y-1"
              >
                Verify a Credential
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="py-24 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-base font-semibold text-primary-600 uppercase tracking-wide">Powerful Features</h2>
            <p className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Everything you need to run your school efficiently
            </p>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              From admissions to alumni, we've got every aspect of your institution covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                <div className={`h-14 w-14 rounded-2xl ${feature.color} bg-opacity-10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-7 w-7 ${feature.color.replace('bg-', 'text-')}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose the plan that fits your school's needs. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-3xl p-8 ${plan.popular
                  ? 'bg-gray-900 dark:bg-gray-700 text-white shadow-2xl scale-105 z-10'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {plan.name}
                </h3>
                <p className={`mb-6 ${plan.popular ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {plan.description}
                </p>

                <div className="mb-8">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className={`text-lg ${plan.popular ? 'text-gray-300' : 'text-gray-500'}`}>/{plan.period}</span>}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckIcon className={`h-5 w-5 mr-3 ${plan.popular ? 'text-primary-400' : 'text-primary-600'}`} />
                      <span className={plan.popular ? 'text-gray-200' : 'text-gray-600 dark:text-gray-300'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.href}
                  className={`block w-full text-center py-4 rounded-xl font-bold transition-all ${plan.popular
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-600">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-secondary-700 opacity-90"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your School?
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Join thousands of forward-thinking schools today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl text-primary-700 bg-white hover:bg-gray-50 transition-all shadow-xl hover:-translate-y-1"
            >
              Get Started Now
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl text-white border-2 border-white/30 hover:bg-white/10 transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-20 pb-10 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <img src="/logo.png" alt="Edix" className="h-8 w-auto" />
              </div>
              <p className="text-gray-400 leading-relaxed">
                Empowering education through technology. The most comprehensive school management platform.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Product</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><Link to="/verify" className="hover:text-white transition-colors">Verify Credential</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Company</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6">Legal</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Edix. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <GlobeAltIcon className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <ShieldCheckIcon className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
