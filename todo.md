# Centrika Employee Request Portal - TODO

## Database Schema
- [x] Create requests table (leave, car, expenditure)
- [x] Create request_approvals table for workflow tracking
- [x] Create request_attachments table for file uploads
- [x] Create leave_balances table for tracking user leave

## Backend API (tRPC Procedures)
- [x] Create request submission procedures (leave, car, expenditure)
- [x] Create request listing procedures (user requests, pending approvals)
- [x] Create approval workflow procedures (approve, reject, comment)
- [x] Create request detail retrieval procedure
- [x] Create attachment upload/download procedures
- [x] Create dashboard statistics procedures

## Frontend - Core Layout
- [x] Update global styling with dark blue theme and colors
- [x] Create DashboardLayout customization for Centrika branding
- [x] Implement responsive sidebar navigation
- [x] Create header with profile and notifications
- [x] Implement collapsible sidebar for mobile

## Frontend - Dashboard
- [x] Create main dashboard/home page
- [x] Display welcome message with user name
- [x] Show request summary cards (leave, car, expenses)
- [x] Display key statistics (pending approvals, leave balance)
- [x] Create quick action buttons for new requests

## Frontend - Request Management
- [x] Create leave request form with date picker and leave type
- [x] Create car request form with destination and passenger info
- [x] Create expenditure request form with amount and currency
- [ ] Implement file attachment functionality
- [x] Create request list view with filtering and sorting
- [ ] Create request detail view with timeline

## Frontend - Approval Workflow
- [ ] Create pending approvals page
- [ ] Implement approval/rejection actions
- [ ] Create comment/note functionality
- [x] Display request status badges with color coding
- [ ] Show approval timeline and history

## Frontend - User Settings
- [ ] Create settings page
- [ ] Implement profile management
- [ ] Add notification preferences
- [x] Create logout functionality

## Testing & Quality
- [x] Write vitest tests for request procedures
- [x] Write vitest tests for approval workflow
- [ ] Test form validation and error handling
- [ ] Test responsive design on mobile/tablet

## Deployment & Polish
- [ ] Create checkpoint before final deployment
- [x] Verify all features working end-to-end
- [x] Test authentication flow
- [x] Optimize performance and loading states
