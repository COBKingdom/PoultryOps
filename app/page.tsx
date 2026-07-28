"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Egg,
  FileSpreadsheet,
  BarChart3,
  Cloud,
  Users,
  CheckCircle2,
  ArrowDown,
  ClipboardList,
  Settings,
  Shield,
  Lock,
  Mail,
  Calendar,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ==================================================
          NAVIGATION
      ================================================== */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-slate-900">
                PoultryOps
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="#support"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Support
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-lg border-2 border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ==================================================
          SECTION 1 – HERO
      ================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
        <div className="container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
              Modern Poultry Farm Management Software
            </h1>

            <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Run your entire poultry farm from one secure platform.
              <br className="hidden md:block" />
              Track production, feed, flock health, expenses and sales while
              importing your existing spreadsheet records in minutes.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <FileSpreadsheet size={16} />
                Spreadsheet Migration
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <Cloud size={16} />
                Cloud Based
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <Users size={16} />
                Multi-user Ready
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <BarChart3 size={16} />
                Reports & Analytics
              </span>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-8 py-3 text-white font-semibold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                Start Free Trial
              </Link>

              <Link
                href="/login"
                className="rounded-lg border-2 border-slate-200 px-8 py-3 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all hover:-translate-y-0.5"
              >
                Login
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              No credit card required • 14-Day Free Trial
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          PRODUCT SHOWCASE
      ================================================== */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                See PoultryOps in Action
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Explore the real PoultryOps dashboard used to manage production, feed, flock health, expenses, sales and profitability from one secure platform.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-2 shadow-2xl">
              <div className="bg-slate-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="relative aspect-video">
                  <Image
                    src="/images/poultryops-dashboard-landing.png"
                    alt="PoultryOps Dashboard"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 2 – TRUSTED WORKFLOW
      ================================================== */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-blue-50 rounded-3xl p-8 md:p-12 border border-blue-100">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">
                Never Lose Years of Farm Records
              </h2>

              <p className="mt-4 text-lg text-slate-600 text-center">
                Import your existing poultry spreadsheets into PoultryOps and
                continue managing your farm without starting from scratch.
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                    size={24}
                  />
                  <span className="text-slate-700 font-medium">
                    PoultryOps Migration Workbook
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                    size={24}
                  />
                  <span className="text-slate-700 font-medium">
                    Compatible Legacy Farm Spreadsheets
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                    size={24}
                  />
                  <span className="text-slate-700 font-medium">
                    Review Before Import
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                    size={24}
                  />
                  <span className="text-slate-700 font-medium">
                    Secure Data Migration
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 3 – FEATURES
      ================================================== */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Everything You Need to Manage Your Farm
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Powerful features designed specifically for poultry farm
              management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1 - Production Tracking */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                <Egg className="text-blue-600" size={28} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Production Tracking
              </h3>

              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                    size={18}
                  />
                  <span>Egg Production</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                    size={18}
                  />
                  <span>Feed Management</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                    size={18}
                  />
                  <span>Health & Medication</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                    size={18}
                  />
                  <span>Mortality Tracking</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                    size={18}
                  />
                  <span>Sales & Expenses</span>
                </li>
              </ul>
            </div>

            {/* Card 2 - Spreadsheet Migration */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-6">
                <FileSpreadsheet className="text-green-600" size={28} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Spreadsheet Migration
              </h3>

              <p className="text-slate-600 mb-4">
                Import your existing poultry farm spreadsheets in minutes.
              </p>

              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2
                    className="text-green-600 flex-shrink-0 mt-0.5"
                    size={18}
                  />
                  <span>PoultryOps Migration Workbook</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2
                    className="text-green-600 flex-shrink-0 mt-0.5"
                    size={18}
                  />
                  <span>Compatible Legacy Farm Spreadsheets</span>
                </li>
              </ul>
            </div>

            {/* Card 3 - Reports & Performance */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-6">
                <BarChart3 className="text-purple-600" size={28} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Reports & Performance
              </h3>

              <p className="text-slate-600 mb-4">
                View production trends, operating costs and overall farm
                performance from one dashboard.
              </p>

              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2
                    className="text-purple-600 flex-shrink-0 mt-0.5"
                    size={18}
                  />
                  <span>Performance Reports</span>
                </li>
                <li className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2
                    className="text-purple-600 flex-shrink-0 mt-0.5"
                    size={18}
                  />
                  <span>Secure Cloud Access</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 4 – HOW IT WORKS
      ================================================== */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Get started in minutes with our simple onboarding process
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="text-blue-600" size={28} />
                </div>
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto -mt-12 mb-6 relative z-10">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Create Account
                </h3>
                <ArrowDown
                  className="text-slate-400 mx-auto mt-4 hidden md:block"
                  size={24}
                />
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Settings className="text-blue-600" size={28} />
                </div>
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto -mt-12 mb-6 relative z-10">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Setup Farm
                </h3>
                <p className="text-sm text-slate-600 px-4">
                  Configure your farm details and preferences
                </p>
                <ArrowDown
                  className="text-slate-400 mx-auto mt-4 hidden md:block"
                  size={24}
                />
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="text-blue-600" size={28} />
                </div>
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto -mt-12 mb-6 relative z-10">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Import Data
                </h3>
                <p className="text-sm text-slate-600 px-4">
                  Upload your existing spreadsheets
                </p>
                <ArrowDown
                  className="text-slate-400 mx-auto mt-4 hidden md:block"
                  size={24}
                />
              </div>

              {/* Step 4 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-blue-600" size={28} />
                </div>
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto -mt-12 mb-6 relative z-10">
                  4
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Start Managing
                </h3>
                <p className="text-sm text-slate-600 px-4">
                  Track and optimize your farm operations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 5 – WHY POULTRYOPS
      ================================================== */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Why PoultryOps
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Built with the features that matter most to poultry farmers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1 - Secure Cloud Platform */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                <Lock className="text-blue-600" size={28} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Secure Cloud Platform
              </h3>

              <p className="text-slate-600">
                Your farm data is encrypted and securely stored in the cloud.
                Access it anytime, anywhere, with enterprise-grade security.
              </p>
            </div>

            {/* Card 2 - Multi-User Access */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-6">
                <Users className="text-green-600" size={28} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Multi-User Access
              </h3>

              <p className="text-slate-600">
                Collaborate with your team. Assign roles and permissions so
                everyone has the right level of access to manage your farm.
              </p>
            </div>

            {/* Card 3 - Powerful Reports & Analytics */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-6">
                <BarChart3 className="text-purple-600" size={28} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Powerful Reports & Analytics
              </h3>

              <p className="text-slate-600">
                Make data-driven decisions with comprehensive reports on
                production, expenses, and overall farm performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 6 – WHO USES POULTRYOPS
      ================================================== */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Who Uses PoultryOps
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Trusted by poultry operations of all types
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Farm Type 1 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Egg className="text-blue-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Layer Farms
              </h3>
              <p className="text-sm text-slate-600">
                Optimize egg production and flock management
              </p>
            </div>

            {/* Farm Type 2 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Users className="text-green-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Broiler Farms
              </h3>
              <p className="text-sm text-slate-600">
                Track growth cycles and feed efficiency
              </p>
            </div>

            {/* Farm Type 3 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Hatcheries
              </h3>
              <p className="text-sm text-slate-600">
                Manage incubation and hatch rates
              </p>
            </div>

            {/* Farm Type 4 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="text-orange-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Mixed Poultry Farms
              </h3>
              <p className="text-sm text-slate-600">
                Handle diverse operations in one place
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 7 – WHY FARMERS CHOOSE POULTRYOPS
      ================================================== */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Why Farmers Choose PoultryOps
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Join hundreds of poultry farmers who have transformed their operations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 bg-white rounded-2xl p-6 border border-slate-200">
                <CheckCircle2
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                  size={24}
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Save Time
                  </h3>
                  <p className="text-slate-600">
                    Automate repetitive tasks and streamline your farm management workflow
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-2xl p-6 border border-slate-200">
                <CheckCircle2
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                  size={24}
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Reduce Mistakes
                  </h3>
                  <p className="text-slate-600">
                    Eliminate manual data entry errors with validated, structured records
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-2xl p-6 border border-slate-200">
                <CheckCircle2
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                  size={24}
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Increase Profitability
                  </h3>
                  <p className="text-slate-600">
                    Make informed decisions with real-time insights into costs and revenues
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-2xl p-6 border border-slate-200">
                <CheckCircle2
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                  size={24}
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Access From Anywhere
                  </h3>
                  <p className="text-slate-600">
                    Cloud-based access lets you manage your farm from any device
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-2xl p-6 border border-slate-200 md:col-span-2">
                <CheckCircle2
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                  size={24}
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Import Existing Spreadsheet Data
                  </h3>
                  <p className="text-slate-600">
                    Keep your historical records. Import years of farm data from your existing spreadsheets in minutes, not months
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 8 – FINAL CALL-TO-ACTION
      ================================================== */}
      <section className="py-24 bg-blue-600">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Modernise Your Poultry Farm?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join hundreds of poultry farmers already using PoultryOps to streamline their operations and boost productivity.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="rounded-lg bg-white px-8 py-4 text-blue-600 font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Start Free Trial
              </Link>
              <a
                href="https://wa.me/353899550078?text=Hi%2C%20I'm%20interested%20in%20seeing%20a%20demo%20of%20PoultryOps.%20I'd%20like%20to%20learn%20how%20it%20can%20help%20manage%20my%20poultry%20farm."
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border-2 border-white px-8 py-4 text-white font-semibold hover:bg-blue-700 transition-all hover:-translate-y-0.5 inline-flex items-center"
              >
                <Calendar className="inline-block mr-2" size={20} />
                Book a Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-bold text-white">
              PoultryOps
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
              <span>© 2025 PoultryOps. All rights reserved.</span>
              <span>•</span>
              <a href="mailto:support@poultryops.com" className="hover:text-white transition-colors flex items-center gap-1">
                <Mail size={14} />
                support@poultryops.com
              </a>
              <span>•</span>
              <Link
                href="/support"
                className="hover:text-white transition-colors"
              >
                Support
              </Link>
              <span>•</span>
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <span>•</span>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}