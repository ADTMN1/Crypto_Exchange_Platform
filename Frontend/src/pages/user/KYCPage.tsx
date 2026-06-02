import { useState } from 'react';
import { FaIdCard, FaFileUpload, FaCheckCircle, FaClock, FaExclamationCircle, FaPassport, FaHome, FaCamera } from 'react-icons/fa';

type VerificationStatus = 'not-started' | 'pending' | 'approved' | 'rejected';

export default function KycPage() {
  const [verificationStatus] = useState<VerificationStatus>('not-started');
  const [uploadedDocs, setUploadedDocs] = useState({
    idDocument: null as File | null,
    proofOfAddress: null as File | null,
    selfie: null as File | null,
  });

  const handleFileUpload = (type: keyof typeof uploadedDocs, file: File | null) => {
    setUploadedDocs({ ...uploadedDocs, [type]: file });
  };

  const getStatusInfo = (status: VerificationStatus) => {
    switch (status) {
      case 'approved':
        return {
          icon: <FaCheckCircle size={48} style={{ color: '#24C576' }} />,
          title: 'Verification Approved',
          message: 'Your identity has been successfully verified',
          color: '#24C576',
        };
      case 'pending':
        return {
          icon: <FaClock size={48} style={{ color: '#f59e0b' }} />,
          title: 'Verification Pending',
          message: 'Your documents are being reviewed. This usually takes 24-48 hours',
          color: '#f59e0b',
        };
      case 'rejected':
        return {
          icon: <FaExclamationCircle size={48} style={{ color: '#E53935' }} />,
          title: 'Verification Rejected',
          message: 'Your verification was rejected. Please review the feedback and resubmit',
          color: '#E53935',
        };
      default:
        return {
          icon: <FaIdCard size={48} style={{ color: '#F7931A' }} />,
          title: 'Identity Verification Required',
          message: 'Complete KYC verification to unlock all platform features',
          color: '#F7931A',
        };
    }
  };

  const statusInfo = getStatusInfo(verificationStatus);

  const verificationLevels = [
    {
      level: 1,
      title: 'Basic Verification',
      status: 'completed' as const,
      benefits: ['Email verification', 'Basic trading features', 'Deposit up to $1,000/day'],
    },
    {
      level: 2,
      title: 'Identity Verification',
      status: verificationStatus === 'approved' ? 'completed' : verificationStatus,
      benefits: ['Full trading access', 'Deposit up to $10,000/day', 'Withdrawal access'],
    },
    {
      level: 3,
      title: 'Advanced Verification',
      status: 'not-started' as const,
      benefits: ['Unlimited deposits', 'Higher withdrawal limits', 'Priority support'],
    },
  ];

  return (
    <main className="kyc-page">
      {/* Header */}
      <div className="kyc-header">
        <h1 className="page-title">
          <FaIdCard className="title-icon" />
          KYC Verification
        </h1>
        <p className="page-subtitle">
          Verify your identity to unlock full platform features and higher limits
        </p>
      </div>

      <div className="kyc-content">
        {/* Status Card */}
        <div className="kyc-status-card" style={{ borderColor: statusInfo.color }}>
          <div className="status-icon">{statusInfo.icon}</div>
          <div className="status-info">
            <h2 className="status-title">{statusInfo.title}</h2>
            <p className="status-message">{statusInfo.message}</p>
          </div>
        </div>

        {/* Verification Levels */}
        <div className="verification-levels">
          <h3 className="section-title">Verification Levels</h3>
          <div className="levels-grid">
            {verificationLevels.map((level) => (
              <div key={level.level} className={`level-card ${level.status}`}>
                <div className="level-header">
                  <span className="level-number">Level {level.level}</span>
                  {level.status === 'completed' && (
                    <FaCheckCircle style={{ color: '#24C576' }} />
                  )}
                  {level.status === 'pending' && (
                    <FaClock style={{ color: '#f59e0b' }} />
                  )}
                </div>
                <h4 className="level-title">{level.title}</h4>
                <ul className="level-benefits">
                  {level.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Document Upload Section */}
        {verificationStatus === 'not-started' && (
          <div className="kyc-upload-section">
            <h3 className="section-title">Required Documents</h3>
            <p className="section-subtitle">
              Please upload clear, high-quality images of the following documents
            </p>

            <div className="upload-grid">
              {/* ID Document */}
              <div className="upload-card">
                <div className="upload-icon">
                  <FaPassport size={32} />
                </div>
                <h4 className="upload-title">Government ID</h4>
                <p className="upload-description">
                  Passport, Driver's License, or National ID Card
                </p>
                <label className="upload-btn">
                  <FaFileUpload /> {uploadedDocs.idDocument ? 'Change File' : 'Upload Document'}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('idDocument', e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                </label>
                {uploadedDocs.idDocument && (
                  <p className="upload-filename">
                    <FaCheckCircle style={{ color: '#24C576' }} /> {uploadedDocs.idDocument.name}
                  </p>
                )}
              </div>

              {/* Proof of Address */}
              <div className="upload-card">
                <div className="upload-icon">
                  <FaHome size={32} />
                </div>
                <h4 className="upload-title">Proof of Address</h4>
                <p className="upload-description">
                  Utility bill, bank statement, or lease agreement
                </p>
                <label className="upload-btn">
                  <FaFileUpload /> {uploadedDocs.proofOfAddress ? 'Change File' : 'Upload Document'}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('proofOfAddress', e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                </label>
                {uploadedDocs.proofOfAddress && (
                  <p className="upload-filename">
                    <FaCheckCircle style={{ color: '#24C576' }} /> {uploadedDocs.proofOfAddress.name}
                  </p>
                )}
              </div>

              {/* Selfie */}
              <div className="upload-card">
                <div className="upload-icon">
                  <FaCamera size={32} />
                </div>
                <h4 className="upload-title">Selfie Verification</h4>
                <p className="upload-description">
                  Photo of yourself holding your ID document
                </p>
                <label className="upload-btn">
                  <FaFileUpload /> {uploadedDocs.selfie ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('selfie', e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                </label>
                {uploadedDocs.selfie && (
                  <p className="upload-filename">
                    <FaCheckCircle style={{ color: '#24C576' }} /> {uploadedDocs.selfie.name}
                  </p>
                )}
              </div>
            </div>

            <div className="upload-guidelines">
              <h4>Document Guidelines</h4>
              <ul>
                <li>Documents must be valid and not expired</li>
                <li>All text must be clearly visible and readable</li>
                <li>No glare or shadows on the documents</li>
                <li>File format: JPG, PNG, or PDF (max 5MB)</li>
                <li>Ensure all four corners of the document are visible</li>
              </ul>
            </div>

            <div className="submit-section">
              <button 
                className="btn-submit" 
                disabled={!uploadedDocs.idDocument || !uploadedDocs.proofOfAddress || !uploadedDocs.selfie}
              >
                Submit for Verification
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
