import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPage() {
  const brandColor = "#f6773e"; // Exact orange from your shneta logo

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            {/* Make sure logo.png is inside your public/ folder */}
            <img 
              src="/logo.png" 
              alt="Shneta Logo" 
              className="h-10 w-auto object-contain" 
            />
          </Link>
          <Link 
            to="/" 
            className="text-sm font-medium hover:underline transition-colors"
            style={{ color: brandColor }}
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-sm rounded-2xl border border-gray-100">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-4 text-gray-500">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="h-1 w-24 mx-auto mt-6 rounded-full" style={{ backgroundColor: brandColor }}></div>
          </div>

          <div className="space-y-8 text-gray-600 leading-relaxed">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span style={{ color: brandColor }}>1.</span> Introduction
              </h2>
              <p>
                Welcome to <strong>Shneta</strong>. We value your privacy and are committed to protecting your personal data. 
                This Privacy Policy explains how we handle the information we collect when you use our pharmacy e-commerce application. 
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span style={{ color: brandColor }}>2.</span> Free Browsing
              </h2>
              <p>
                Our platform is designed to let you explore freely. <strong>You do not need to create an account to browse our products.</strong> 
                While you are browsing as a guest, we do not collect any personal identifying information such as your name or address.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span style={{ color: brandColor }}>3.</span> Information We Collect for Orders
              </h2>
              <p className="mb-2">
                If you choose to purchase pharmacy products through our platform, you will be required to create an account and place an order. During this signup and checkout process, we collect the following personal information:
              </p>
              <ul className="list-disc pl-6 space-y-1 bg-gray-50 p-4 rounded-lg border border-gray-100 mt-2">
                <li><strong>Full Name:</strong> To address you correctly and process your invoice.</li>
                <li><strong>Delivery Address:</strong> To deliver your pharmacy products directly to your doorstep.</li>
                <li><strong>Email Address:</strong> To send you order confirmations, receipts, and important account updates.</li>
                <li><strong>Contact Number:</strong> To coordinate deliveries or reach out in case of urgent order issues.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span style={{ color: brandColor }}>4.</span> How We Use Your Information
              </h2>
              <p>
                The information you provide is strictly used for order fulfillment, customer support, and improving your e-commerce experience on the Shneta app. We do not sell your personal data to third parties. We may share necessary details (like your address and phone number) exclusively with our trusted delivery partners so you can receive your orders.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span style={{ color: brandColor }}>5.</span> Data Security
              </h2>
              <p>
                As a pharmacy e-commerce platform, we take security seriously. We implement modern, standard security protocols to ensure that your addresses, emails, and sensitive purchase histories are stored securely and protected from unauthorized access.
              </p>
            </section>
            
            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span style={{ color: brandColor }}>6.</span> Your Rights
              </h2>
              <p>
                You have the right to access, update, or delete your personal information at any time. You can make these changes through your account dashboard, or by reaching out to our support team.
              </p>
            </section>

          </div>
          
          <div className="mt-12 p-6 rounded-xl border border-orange-100 bg-orange-50 text-center text-sm text-gray-600">
            If you have any questions or concerns regarding our privacy practices, please contact us via the app support page. <br />
            <strong>© {new Date().getFullYear()} Shneta. All rights reserved.</strong>
          </div>

        </div>
      </main>
    </div>
  );
}