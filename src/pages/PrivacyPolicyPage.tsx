
import React from "react";
import MobileHeader from "@/components/MobileHeader";
import Header from "@/components/Header";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-temple-background">
      <Header />
      <MobileHeader title={t("common.privacyPolicy")} showBackButton={true} />
      
      <div className="container mx-auto px-4 py-8 mb-20">
        <Card className="temple-card">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-temple-maroon mb-6">Privacy Policy</h1>
            
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-temple-maroon mb-2">1. Introduction</h2>
              <p>
                Book Store Manager values your privacy and is committed to protecting your personal information.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
                you use our mobile application.
              </p>
            </section>
            
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-temple-maroon mb-2">2. Information We Collect</h2>
              <p className="mb-4">
                We collect the following types of information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Personal Information:</strong> Name, email address, phone number, and other
                  information you provide when creating an account or using our services.
                </li>
                <li>
                  <strong>Transaction Information:</strong> Details about books sold, purchased, orders placed,
                  and payment information.
                </li>
                <li>
                  <strong>Usage Data:</strong> Information about how you use our application, including
                  access times, pages viewed, and features used.
                </li>
                <li>
                  <strong>Device Information:</strong> Information about your mobile device, including
                  device type, operating system, and unique device identifiers.
                </li>
              </ul>
            </section>
            
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-temple-maroon mb-2">3. How We Use Your Information</h2>
              <p className="mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send notifications related to your account or transactions</li>
                <li>Monitor and analyze usage trends to improve user experience</li>
                <li>Protect against unauthorized access and fraud</li>
                <li>Communicate with you about products, services, and events</li>
              </ul>
            </section>
            
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-temple-maroon mb-2">4. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction. However,
                no method of transmission over the Internet or electronic storage is 100% secure, and
                we cannot guarantee absolute security.
              </p>
            </section>
            
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-temple-maroon mb-2">5. Data Retention</h2>
              <p>
                We will retain your information for as long as your account is active or as needed to
                provide you services, comply with legal obligations, resolve disputes, and enforce our
                agreements.
              </p>
            </section>
            
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-temple-maroon mb-2">6. Your Rights</h2>
              <p className="mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate personal information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to processing of your personal information</li>
                <li>Request restriction of processing your personal information</li>
                <li>Request transfer of your personal information</li>
              </ul>
            </section>
            
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-temple-maroon mb-2">7. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes
                by posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-temple-maroon mb-2">8. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
                <br />
                <a href="mailto:contact@bookstoremanager.com" className="text-temple-saffron">contact@bookstoremanager.com</a>
              </p>
            </section>
            
            <div className="mt-8 text-sm text-gray-500">
              Last Updated: April 29, 2025
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
