# Centrika OnePortal — Project Overview

## 1. Executive Summary
**Centrika OnePortal** is a comprehensive, centralized Employee Self-Service (ESS) and Operational Workflow Management system. It is designed to digitize and automate core internal processes, replacing paper-based manual workflows with a highly structured, accountable, and efficient digital platform.

The system serves as the single point of entry for employees to manage their lifecycle within the company—from requesting leave and transport to managing expenses and company assets.

---

## 2. Core Modules & Capabilities

### 🛡️ Leave Management
Automates the end-to-end leave lifecycle.
- **Types supported:** Annual, Sick, Personal, Maternity/Paternity, and Unpaid leave.
- **Balance Tracking:** Automatic calculation of entitled, taken, and remaining days.
- **Backup Assignment:** Ensures business continuity by requiring a backup person designation for every request.

### 🚗 Fleet & Transport (Car Requests)
Streamlines the utilization of company vehicles for official business.
- **Workflow:** Requires HOD approval for necessity and HR oversight for logistics.
- **Tracking:** Captures destination, purpose, departure time, and passenger details.

### 💰 Expenditure & Petty Cash
Provides a transparent channel for financial reimbursement and expense tracking.
- **Integration:** Directly links requests to departmental budgets.
- **Verification:** Multi-stage approval by Finance and Management to ensure fiscal responsibility.

### 📦 Asset Management
Full lifecycle tracking of company-owned equipment (IT, Furniture, Software).
- **Inventory:** Centralized registry of all assets with unique tags and serial numbers.
- **Assignment:** Digital hand-over protocols with employee acceptance.
- **Maintenance:** Tracking of repair history, warranties, and vendor details.

### 📄 Employee Self-Service & Records
- **Digital Dossier:** Centralized storage for employee IDs, passports, and contracts.
- **Policy Portal:** Instant access to company policies and internal announcements.
- **Anonymous Suggestions:** A safe channel for employees to provide feedback directly to management.

---

## 3. Key Value Propositions

### 🚀 Operational Efficiency
- **Zero Paperwork:** Eliminates physical form printing, signing, and manual delivery.
- **Instant Processing:** Automated notifications inform the next approver the moment a request is submitted, drastically reducing approval latency.

### 🔍 Accountability & Governance
- **Digital Signatures:** Every approval (HOD, HR, Finance, CEO) captures a unique digital signature, ensuring legal and internal compliance.
- **Audit Logs:** Every click and action is timestamped and logged, providing a clear history of decision-making.

### 📊 Management Visibility
- **Unified Dashboard:** Real-time visibility into organizational workload, pending approvals, and resource allocation.
- **Budget Control:** Financial requests are cross-referenced against departmental budgets before approval.

### 🔒 Security & Compliance
- **Role-Based Access (RBAC):** Strict permissions ensure users only see data relevant to their role.
- **MFA Ready:** Built-in support for Multi-Factor Authentication (OTP via Email/SMS) for sensitive actions.

---

## 4. Technical Architecture
- **Frontend:** Built with **React & Vite** for a modern, responsive, and high-performance user interface.
- **Backend:** Powered by **Node.js & tRPC**, ensuring type-safety and robust communication between parts of the system.
- **Database:** High-reliability **PostgreSQL** for relational data (Audit logs, Users, Workflows) and **Prisma** for data orchestration.
- **Mail Engine:** Integrated SMTP service for automated alerts and PDF report delivery.

---

## 5. Strategic Goal
The ultimate goal of Centrika OnePortal is to foster a **culture of transparency and speed**. By removing the "human follow-up" bottleneck, the system allows the team to focus on high-value work while the portal handles the operational logistics.
