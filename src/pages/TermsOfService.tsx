
import { Helmet } from "react-helmet";

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 pt-24 pb-20">
      <Helmet>
        <title>Terms of Service - RippleEffect</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using RippleEffect's services, you agree to be bound by these Terms of Service. If you do not agree 
              to all the terms and conditions, you must not access or use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              RippleEffect provides financial market analytics and event impact analysis services. We offer tools to help users 
              understand how various events may impact financial markets and specific securities.
            </p>
            <p className="mt-2">
              We reserve the right to modify, suspend, or discontinue any part of our service at any time, with or without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p>
              Some features of our service require registration for an account. You agree to provide accurate, current, and complete 
              information during the registration process and to update such information to keep it accurate, current, and complete.
            </p>
            <p className="mt-2">
              You are responsible for safeguarding your password and for all activities that occur under your account. You agree to 
              notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payments</h2>
            <p>
              RippleEffect offers subscription-based services. By subscribing to our premium services, you agree to pay all fees 
              associated with the subscription plan you choose.
            </p>
            <p className="mt-2">
              We reserve the right to change our subscription fees at any time, with notice provided at least 30 days in advance 
              of any price change.
            </p>
            <p className="mt-2">
              You may cancel your subscription at any time through your account settings. Upon cancellation, you will continue to 
              have access to premium features until the end of your current billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
            <p>
              All content, features, and functionality of our service, including but not limited to text, graphics, logos, icons, 
              and software, are the exclusive property of RippleEffect and are protected by United States and international 
              copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mt-2">
              You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, 
              download, store, or transmit any of the material on our website without our prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p>
              RippleEffect and its affiliates, service providers, employees, agents, officers, or directors shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages, including but not limited to, loss of profits, data, 
              use, goodwill, or other intangible losses.
            </p>
            <p className="mt-2">
              Our service is provided on an "as is" and "as available" basis, without any warranties of any kind, either express or implied.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Disclaimer of Warranties</h2>
            <p>
              The information provided through our service is for informational purposes only and should not be considered as financial 
              advice. We do not guarantee the accuracy, completeness, or usefulness of any information on our website or obtained through 
              our service.
            </p>
            <p className="mt-2">
              Any reliance you place on such information is strictly at your own risk. We disclaim all liability and responsibility arising 
              from any reliance placed on such materials by you or any other visitor to our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
            <p>
              These Terms shall be governed by and defined following the laws of the United States. RippleEffect and yourself irrevocably 
              consent that the courts in the United States shall have exclusive jurisdiction to resolve any dispute which may arise in 
              connection with these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
            <p>
              We may revise these Terms of Service at any time without notice. By using our service, you are agreeing to be bound by the 
              then-current version of these Terms of Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> abhonsle@tmsacademy.org<br />
              <strong>Phone:</strong> +1 (919) 725-3410
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
