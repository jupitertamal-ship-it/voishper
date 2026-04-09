import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <h1 className="text-3xl font-bold font-display mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: April 9, 2026</p>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:font-display [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">
          <p>At Voishper ("we," "our," or "us"), your privacy is of paramount importance. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform at voishper.lovable.app (the "Service"). By using our Service, you consent to the data practices described in this policy.</p>

          <h2>1. Information We Collect</h2>
          <p><strong>Account Information:</strong> When you register, we collect your email address, display name, and authentication credentials. If you sign in with Google, we receive your name, email, and profile picture from Google's OAuth service.</p>
          <p><strong>Usage Data:</strong> We automatically collect information about how you interact with the Service, including pages visited, features used, scrape counts, message counts, and timestamps of activity. This data helps us improve the Service and enforce usage limits.</p>
          <p><strong>Knowledge Base Content:</strong> When you scrape websites or upload content, we store the extracted text data on our servers to power your AI chatbot's responses. This content remains associated with your account and your bots.</p>
          <p><strong>Chat Data:</strong> Conversations between end-users and your AI chatbot may be logged for analytics, lead capture, and quality improvement purposes. Chat transcripts may include names and email addresses voluntarily provided by end-users.</p>
          <p><strong>Payment Information:</strong> We collect transaction IDs and payment method details submitted through our manual payment verification system. We do not store full credit card numbers or sensitive financial credentials directly.</p>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information for the following purposes: (a) providing, maintaining, and improving the Service; (b) processing payments and managing subscriptions; (c) personalizing your experience and delivering relevant features; (d) generating AI responses based on your knowledge base content; (e) capturing and organizing leads from chatbot interactions; (f) producing analytics and usage reports; (g) enforcing our Terms of Service and preventing abuse; (h) communicating important updates about your account or the Service; and (i) complying with legal obligations.</p>

          <h2>3. Data Storage & Security</h2>
          <p>Your data is stored on secure cloud infrastructure with industry-standard encryption at rest and in transit. We implement Row Level Security (RLS) policies to ensure strict tenant isolation — your data is accessible only to your account. We use secure authentication tokens, session management, and role-based access controls to prevent unauthorized access. Despite our best efforts, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>

          <h2>4. Data Sharing & Third-Party Services</h2>
          <p>We do not sell, rent, or trade your personal information to third parties. We may share data with: (a) cloud infrastructure providers for hosting and storage; (b) AI model providers for processing chatbot responses (only the conversation context, not your personal account details); (c) analytics tools to understand usage patterns; and (d) law enforcement or regulatory authorities when required by law or to protect our rights and the safety of our users. All third-party service providers are bound by confidentiality obligations.</p>

          <h2>5. GDPR Compliance (European Users)</h2>
          <p>If you are located in the European Economic Area (EEA), you have the following rights under the General Data Protection Regulation (GDPR):</p>
          <p><strong>Right of Access:</strong> You may request a copy of the personal data we hold about you. <strong>Right to Rectification:</strong> You may request correction of inaccurate or incomplete data. <strong>Right to Erasure:</strong> You may request deletion of your personal data, subject to legal retention requirements. <strong>Right to Restriction:</strong> You may request that we limit the processing of your data in certain circumstances. <strong>Right to Data Portability:</strong> You may request your data in a structured, machine-readable format. <strong>Right to Object:</strong> You may object to the processing of your data for certain purposes, including direct marketing.</p>
          <p>To exercise any of these rights, please contact us through the platform's support channels. We will respond to all legitimate requests within 30 days.</p>

          <h2>6. Data Retention</h2>
          <p>We retain your personal data for as long as your account is active or as needed to provide the Service. When you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain certain information for legal, tax, or audit purposes. Knowledge base content and chat transcripts associated with deleted accounts are permanently removed from our active databases. Backup copies may persist for up to 90 days before being automatically purged.</p>

          <h2>7. Cookies & Tracking Technologies</h2>
          <p>We use essential cookies and local storage to maintain your authentication session and remember your preferences. We do not use third-party advertising cookies or cross-site tracking technologies. The embedded chat widget on third-party websites may use session identifiers to maintain conversation context, but these do not track users across different websites.</p>

          <h2>8. Children's Privacy</h2>
          <p>The Service is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we discover that we have inadvertently collected data from a minor, we will promptly delete it. If you believe a child has provided us with personal information, please contact us immediately.</p>

          <h2>9. International Data Transfers</h2>
          <p>Your data may be transferred to, stored, and processed in countries outside your country of residence, including countries that may have different data protection laws. By using the Service, you consent to such transfers. We ensure that appropriate safeguards are in place, including standard contractual clauses where applicable, to protect your data during international transfers.</p>

          <h2>10. AI Data Processing</h2>
          <p>When your chatbot processes a user query, the conversation context (including your knowledge base content relevant to the query) is sent to our AI processing pipeline. <strong>We do not use your knowledge base content or chat data to train our AI models.</strong> Your data is used solely for generating responses within your chatbot sessions. AI processing is performed through secure API calls with encryption in transit.</p>

          <h2>11. Data Breach Notification</h2>
          <p>In the event of a data breach that poses a risk to your rights and freedoms, we will notify affected users via email within 72 hours of becoming aware of the breach. We will also notify the relevant supervisory authorities as required by applicable law. Our notification will include the nature of the breach, likely consequences, and measures taken or proposed to address the breach.</p>

          <h2>12. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, or legal requirements. We will notify you of material changes by posting a prominent notice on the Service or sending you an email. Your continued use of the Service after such changes constitutes acceptance of the updated policy.</p>

          <h2>13. Contact Us</h2>
          <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at <strong>support@voishper.lovable.app</strong> or through the Voishper platform's built-in support widget. We are committed to resolving any privacy-related concerns promptly and transparently.</p>
        </div>
      </div>
    </div>
  );
}
