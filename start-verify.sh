#!/bin/bash
export PGPASSWORD=homologa_ci_only
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=homologa
export PGUSER=homologa
export DATABASE_URL=postgresql://homologa:homologa_ci_only@localhost:5432/homologa
export NEXT_PUBLIC_APP_URL=http://localhost:3000
export APP_ENV=local
export AUTH_PROVIDER=local-test
export DATABASE_PROVIDER=postgres
export STORAGE_PROVIDER=azurite
export LOCAL_TEST_USER_ID=00000000-0000-4000-8000-000000000001
export AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
export AZURE_STORAGE_CASE_DOCUMENTS_CONTAINER=case-documents
export AZURE_STORAGE_GENERATED_REPORTS_CONTAINER=generated-reports
export DOCUMENT_RETENTION_DAYS=30
export DOCUMENT_UPLOAD_UI_ENABLED=true
export DOCUMENT_RETENTION_JOB_TOKEN=local-retention-job-test-only

docker compose up -d --wait
npm run db:migrate:portable || true
npm run db:seed
npm run dev > /tmp/homologa-next2.log 2>&1 &
sleep 5
npm run documents:verify-local
