export interface AdditionalDocuments {
  id: string;
  applicationId: string;
  identityDocument?: string;
  degreeCertifications?: string;
  referenceOne?: string;
  referenceTwo?: string;
  fullProjectProposal?: string;
  fundingPlan?: string;
  riskMitigation?: string;
  achievements?: string;
  languageProficiency?: string;
  submissionStatus: 'pending' | 'submitted';
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
} 