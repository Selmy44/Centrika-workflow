ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'document_reviewed';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'document_requested';

-- Expiry, review reason, notes and uploader on staff documents
ALTER TABLE "employee_documents"
  ADD COLUMN "expires_at" TIMESTAMP(3),
  ADD COLUMN "rejection_reason" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "uploaded_by_id" INTEGER;
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "employee_documents_user_id_category_idx" ON "employee_documents"("user_id", "category");
CREATE INDEX "employee_documents_status_idx" ON "employee_documents"("status");

-- Managed document types
CREATE TABLE "document_types" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(255),
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "tracks_expiry" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "document_types_key_key" ON "document_types"("key");
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- Starting list. The first four keep the keys staff uploads already use.
INSERT INTO "document_types" ("key", "name", "description", "is_required", "tracks_expiry") VALUES
  ('ID_PASSPORT',          'National ID or passport',                'Government photo ID',                                   true,  true),
  ('CONTRACT',             'Signed employment contract',             'The contract signed by both parties',                    true,  true),
  ('ACADEMIC_CERTIFICATE', 'Academic certificates',                  'Highest degree or diploma',                             true,  false),
  ('OTHER',                'Other document',                         'Anything not covered by another type',                  false, false),
  ('CV',                   'CV / résumé',                            'Latest CV',                                             true,  false),
  ('BANK_DETAILS',         'Bank account details',                   'Bank letter or statement header for salary payments',  true,  false),
  ('RSSB',                 'RSSB social security card',              'Rwanda Social Security Board registration',             true,  false),
  ('OFFER_LETTER',         'Signed offer letter',                    NULL,                                                    false, false),
  ('TIN',                  'TIN certificate',                        'Rwanda Revenue Authority tax identification',          false, false),
  ('CRIMINAL_RECORD',      'Criminal record certificate',            'Certificate of good conduct',                           false, true),
  ('MEDICAL',              'Medical certificate or insurance card',  NULL,                                                    false, true),
  ('PROFESSIONAL_CERT',    'Professional certification',             'Licences and professional body memberships',            false, true),
  ('NDA',                  'Confidentiality agreement (NDA)',        NULL,                                                    false, false),
  ('DRIVING_LICENCE',      'Driving licence',                        'For staff who drive company vehicles',                  false, true),
  ('NEXT_OF_KIN',          'Next-of-kin / emergency contact form',   NULL,                                                    false, false);

-- HR requests for documents
CREATE TABLE "document_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type_key" VARCHAR(50) NOT NULL,
    "requested_by_id" INTEGER NOT NULL,
    "message" TEXT,
    "due_date" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    CONSTRAINT "document_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "document_requests_user_id_status_idx" ON "document_requests"("user_id", "status");
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
