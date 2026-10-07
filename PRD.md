# Novintix ERP — Product Requirements Document

| Field            | Value                            |
| ---------------- | -------------------------------- |
| Product          | Novintix ERP                     |
| Document version | 1.0                              |
| Date             | 7 October 2026                   |
| Release scope    | Phase 1 foundation               |
| Status           | Draft for stakeholder review     |
| Owners           | Product, Engineering, Operations |

## 1. Executive summary

Novintix ERP is a unified, role-based workspace for small and mid-sized service businesses. It brings customer acquisition, follow-up activity, hiring, basic finance operations, secure document handling, and administrative control into one web application.

Phase 1 establishes a secure and extensible operational foundation. It replaces disconnected spreadsheets and informal hand-offs with structured records, permission-controlled workflows, auditability, and near-real-time updates. The modular design allows each business function to evolve while reusing common identity, authorization, files, and shared contracts.

## 2. Problem statement

Business teams often manage leads, customer follow-ups, candidates, invoices, expenses, and supporting documents in separate tools. This creates duplicate entry, inconsistent ownership, missed actions, weak access control, and limited leadership visibility.

Novintix ERP must provide one reliable source of truth where:

- employees see only the modules and actions relevant to their role;
- teams move work through explicit, measurable statuses;
- managers see what needs attention without assembling manual reports;
- sensitive files and financial records are protected and traceable;
- administrators can change access without deploying code; and
- future modules can reuse a common platform foundation.

## 3. Product vision

Enable every Novintix team to run daily business operations from a single secure workspace, with clear ownership, measurable workflows, and trustworthy data.

## 4. Goals and success measures

### Phase 1 goals

1. Centralize records used by sales, recruitment, finance, and operations.
2. Enforce server-side role-based access for every protected action.
3. Make the next required action visible through dashboards, statuses, and follow-ups.
4. Provide secure file handling that can move to managed object storage.
5. Establish shared contracts, audit records, and real-time events for future modules.

### Proposed product metrics

Baselines will be captured during the pilot; these are initial targets.

| Metric                                                      | Phase 1 target                        |
| ----------------------------------------------------------- | ------------------------------------- |
| Weekly active users among provisioned pilot users           | At least 80%                          |
| Leads with an assigned owner                                | At least 95%                          |
| Pending follow-ups completed or rescheduled by due date     | At least 85%                          |
| Candidate stage changes recorded in the system              | At least 90% of pilot hiring activity |
| Issued invoices with current payment status                 | At least 95%                          |
| Unauthorized access to protected actions                    | 0 confirmed incidents                 |
| Successful API requests, excluding client/validation errors | At least 99.5%                        |
| P95 response time for ordinary list/detail APIs             | Under 500 ms at pilot load            |

### Non-goals for Phase 1

- Full accounting, general ledger, payroll, inventory, procurement, or tax filing
- Marketing automation and bulk message delivery
- Public applicant or customer portals
- Native mobile apps or offline operation
- Multi-company consolidation and inter-company accounting
- AI scoring, ranking, forecasting, or anomaly detection
- Replacing enterprise specialist CRM, ATS, HRIS, or accounting systems

## 5. Users and personas

| Persona             | Primary needs                                      | Typical access                            |
| ------------------- | -------------------------------------------------- | ----------------------------------------- |
| Executive/Viewer    | See business health without changing data          | Dashboard and read-only modules           |
| Sales Executive     | Capture leads and complete follow-ups              | Leads, follow-ups, files                  |
| Sales Manager       | Manage pipeline, assignments, and activity         | Full CRM and related files                |
| Recruiter           | Create candidates and update hiring stages         | Recruitment and files                     |
| HR Manager          | Manage openings and oversee hiring                 | Full recruitment and related files        |
| Accountant          | Maintain parties, invoices, payments, and expenses | Finance and files; no approval by default |
| Finance Manager     | Review summaries and approve expenses              | Full finance and related files            |
| Administrator       | Provision users and operational access             | Users and broad module access             |
| Super Administrator | Maintain roles, permissions, and all access        | All permissions                           |

## 6. Scope and current status

**Implemented** means present in the Phase 1 codebase. **Partial** means a foundation exists but is not production-complete. **Planned** means later work is required.

| Capability                          | Status      | Notes                                                      |
| ----------------------------------- | ----------- | ---------------------------------------------------------- |
| Authentication and session rotation | Implemented | Access JWT and rotated HTTP-only refresh cookie            |
| Role-based authorization            | Implemented | Backend enforcement and permission-aware UI                |
| Dashboard                           | Implemented | Content adapts to user permissions                         |
| Leads and follow-ups                | Implemented | CRUD, statuses, filtering, search, assignment              |
| Recruitment                         | Implemented | Openings, candidates, candidate stage movement             |
| Finance                             | Implemented | Parties, invoices, payments, expenses, approvals           |
| File workspace                      | Implemented | Local upload, download, preview, validation, soft deletion |
| Audit logging                       | Partial     | Sensitive operations are recorded; review UI/API pending   |
| Notifications                       | Partial     | Data model/event contract exist; user workflow pending     |
| Background jobs                     | Partial     | Redis/BullMQ foundation exists; workers pending            |
| Cloud object storage                | Planned     | Interface exists; adapters/presigned flow pending          |
| Password recovery                   | Partial     | Safe acknowledgement exists; delivery/reset pending        |
| Automated tests                     | Planned     | Unit, integration, and E2E coverage required               |
| Production operations               | Planned     | Deployment, metrics, alerts, backup/restore required       |

## 7. Functional requirements

Priorities use Must, Should, and Could.

### 7.1 Identity and access

| ID     | Requirement                                                                           | Priority | Status      |
| ------ | ------------------------------------------------------------------------------------- | -------- | ----------- |
| IAM-01 | Users must sign in with email and password.                                           | Must     | Implemented |
| IAM-02 | The system must issue short-lived access tokens and rotate refresh tokens.            | Must     | Implemented |
| IAM-03 | Sessions must be revocable on logout, password change, deactivation, and token reuse. | Must     | Implemented |
| IAM-04 | Every protected API action must require a named permission.                           | Must     | Implemented |
| IAM-05 | Navigation and controls should reflect user permissions.                              | Should   | Implemented |
| IAM-06 | Administrators must create, update, deactivate, and role-assign users.                | Must     | Implemented |
| IAM-07 | Authorized admins must create roles and edit permission mappings.                     | Must     | Implemented |
| IAM-08 | Users must not deactivate or delete their own account.                                | Must     | Implemented |
| IAM-09 | Password changes must revoke active refresh sessions.                                 | Must     | Implemented |
| IAM-10 | Users should recover passwords through a time-limited, single-use flow.               | Should   | Planned     |

### 7.2 Dashboard

| ID      | Requirement                                                                  | Priority | Status      |
| ------- | ---------------------------------------------------------------------------- | -------- | ----------- |
| DASH-01 | Display only metrics the user is authorized to view.                         | Must     | Implemented |
| DASH-02 | Show lead counts, wins, pipeline, and due/overdue follow-ups to sales users. | Should   | Implemented |
| DASH-03 | Show openings and candidate pipeline size to recruitment users.              | Should   | Implemented |
| DASH-04 | Show billed, collected, expense, and outstanding values to finance users.    | Should   | Implemented |
| DASH-05 | Offer quick links to permitted daily actions.                                | Should   | Implemented |
| DASH-06 | Allow filtering KPIs by date, owner, and department.                         | Could    | Planned     |

### 7.3 CRM

| ID     | Requirement                                                                       | Priority | Status      |
| ------ | --------------------------------------------------------------------------------- | -------- | ----------- |
| CRM-01 | Create leads with contact details, source, priority, value, and owner.            | Must     | Implemented |
| CRM-02 | Assign each lead a unique human-readable code.                                    | Must     | Implemented |
| CRM-03 | Search leads and filter by pipeline status.                                       | Must     | Implemented |
| CRM-04 | Update and soft-archive leads.                                                    | Must     | Implemented |
| CRM-05 | Support New, Contacted, Qualified, Proposal, Negotiation, Won, Lost, and On Hold. | Must     | Implemented |
| CRM-06 | Schedule typed follow-ups against a lead, owner, and date.                        | Must     | Implemented |
| CRM-07 | Support Pending, Completed, Cancelled, Rescheduled, and Missed follow-ups.        | Must     | Implemented |
| CRM-08 | Highlight overdue and upcoming follow-ups.                                        | Should   | Implemented |
| CRM-09 | Generate audit and real-time events for material changes.                         | Should   | Implemented |
| CRM-10 | Support activity history and configurable stages.                                 | Could    | Planned     |
| CRM-11 | Support validated CSV import/export.                                              | Could    | Planned     |

### 7.4 Recruitment

| ID     | Requirement                                                         | Priority | Status      |
| ------ | ------------------------------------------------------------------- | -------- | ----------- |
| REC-01 | Create and update job openings.                                     | Must     | Implemented |
| REC-02 | Track department, location, employment type, openings, and status.  | Must     | Implemented |
| REC-03 | Create, update, view, and archive candidates.                       | Must     | Implemented |
| REC-04 | Link candidates optionally to a job and resume file.                | Must     | Implemented |
| REC-05 | Move candidates through defined stages with permission enforcement. | Must     | Implemented |
| REC-06 | Audit and broadcast stage changes.                                  | Should   | Implemented |
| REC-07 | Record interviews, feedback, ratings, and offer details.            | Should   | Planned     |
| REC-08 | Report time-to-hire and funnel conversion.                          | Could    | Planned     |

### 7.5 Finance

| ID     | Requirement                                                             | Priority | Status      |
| ------ | ----------------------------------------------------------------------- | -------- | ----------- |
| FIN-01 | Create and list customers and vendors.                                  | Must     | Implemented |
| FIN-02 | Create itemized invoices with dates, currency, and tax rates.           | Must     | Implemented |
| FIN-03 | Calculate subtotal, tax, line total, and invoice total on the server.   | Must     | Implemented |
| FIN-04 | Record payments without exceeding the outstanding value.                | Must     | Implemented |
| FIN-05 | Update invoice status to Partially Paid or Paid after payment.          | Must     | Implemented |
| FIN-06 | Record expenses with optional vendor and receipt file.                  | Must     | Implemented |
| FIN-07 | Restrict expense approval/rejection/payment to approvers.               | Must     | Implemented |
| FIN-08 | Show billed, collected, approved/paid expenses, and outstanding totals. | Must     | Implemented |
| FIN-09 | Automatically identify overdue invoices.                                | Should   | Planned     |
| FIN-10 | Generate invoice documents and support customer delivery.               | Should   | Planned     |
| FIN-11 | Support recurring invoices, credit notes, reconciliation, and export.   | Could    | Planned     |

### 7.6 Files

| ID      | Requirement                                                                     | Priority            | Status      |
| ------- | ------------------------------------------------------------------------------- | ------------------- | ----------- |
| FILE-01 | Upload, list, inspect, download, and soft-delete files with permissions.        | Must                | Implemented |
| FILE-02 | Enforce size, extension, MIME, and file-signature rules.                        | Must                | Implemented |
| FILE-03 | Use generated storage keys outside the public web root.                         | Must                | Implemented |
| FILE-04 | Record metadata, checksum, status, uploader, and optional entity link.          | Must                | Implemented |
| FILE-05 | Expose transfer progress, retry, cancellation, and a global queue.              | Should              | Implemented |
| FILE-06 | Move deleted metadata into retention instead of immediately destroying content. | Must                | Implemented |
| FILE-07 | Permanently remove expired retained content through a background worker.        | Must for production | Planned     |
| FILE-08 | Use managed object storage and direct/presigned transfer in production.         | Should              | Planned     |
| FILE-09 | Scan production uploads and quarantine unsafe content.                          | Should              | Planned     |

### 7.7 Audit, notifications, and real time

| ID     | Requirement                                                                               | Priority            | Status      |
| ------ | ----------------------------------------------------------------------------------------- | ------------------- | ----------- |
| OPS-01 | Record actor, action, module, entity, time, and request context for sensitive operations. | Must                | Implemented |
| OPS-02 | Allow authorized admins to search and review audit logs.                                  | Must for production | Planned     |
| OPS-03 | Deliver authorized real-time file and business events.                                    | Should              | Implemented |
| OPS-04 | Authenticate sockets and join only authorized rooms.                                      | Must                | Implemented |
| OPS-05 | Provide an in-app notification inbox with read/unread state.                              | Should              | Planned     |
| OPS-06 | Deliver important reminders/failures through approved external channels.                  | Could               | Planned     |

## 8. Core business rules

1. The backend is the authorization authority; hidden UI controls are not a security boundary.
2. Soft-deleted records are excluded from normal queries.
3. A user cannot deactivate or delete their own account.
4. `SUPER_ADMIN` permissions are maintained by seed policy and cannot be edited through the role API.
5. The server calculates invoice values from quantity, unit price, and tax rate.
6. A payment cannot make `amountPaid` exceed the invoice total.
7. Completing a follow-up sets its completion time; leaving Completed clears it.
8. Candidate stage changes require `candidate.move_stage`.
9. File operations require their specific view, upload, download, or delete permission.
10. File metadata is soft-deleted immediately; physical deletion is deferred to retention processing.

## 9. User experience requirements

- The UI must be responsive from common tablet widths through desktop displays.
- Users must not see navigation for modules they cannot access.
- Forms must show clear field-level validation and retain input after recoverable errors.
- Empty, loading, success, and failure states must be explicit.
- Destructive actions must require confirmation and explain recoverability.
- Status labels and visual treatment must be consistent across the product.
- Focus, labels, contrast, and dialogs should meet WCAG 2.1 AA expectations.
- Dates, times, currency, and numbers must be localized consistently; INR is the current default.

## 10. Data model summary

| Domain      | Primary entities                                         |
| ----------- | -------------------------------------------------------- |
| Identity    | User, Role, Permission, RolePermission, RefreshToken     |
| Governance  | AuditLog, Notification                                   |
| Files       | File, EntityAttachment                                   |
| CRM         | Lead, FollowUp                                           |
| Recruitment | JobOpening, Candidate                                    |
| Finance     | Customer, Vendor, Invoice, InvoiceItem, Payment, Expense |

Primary entities use UUID identifiers. Operational records include timestamps; records requiring recovery or retention use `deletedAt` soft deletion.

## 11. Non-functional requirements

### Security and privacy

- Hash passwords adaptively; never store or log plaintext passwords.
- Supply production secrets through a managed secret store and rotate them independently.
- Use HTTP-only, Secure production refresh cookies with appropriate path and SameSite policies.
- Validate inputs at the API boundary and use parameterized database access.
- Retain rate limits, secure headers, strict CORS, least privilege, and audit logging.
- Encrypt production file storage in transit and at rest.
- Document retention, deletion, access review, and backups for personal and financial data.
- Pass a threat model and dependency/security scan before production launch.

### Performance and scale

- Ordinary APIs should meet a 500 ms P95 target at agreed pilot concurrency, excluding transfers.
- List endpoints must use bounded page sizes or fixed safety limits.
- File transfers must stream where practical and never expose private storage keys.
- Background work must use retryable, idempotent jobs with dead-letter visibility.
- Database indexes must support common status, owner, date, and deletion filters.

### Reliability and recovery

- Initial production availability target: 99.5% monthly.
- Graceful shutdown must safely close HTTP, Socket.IO, database, and queue resources.
- Production data must have encrypted automatic backups with tested restoration.
- Initial targets: RPO at most 24 hours and RTO at most 4 hours.
- Business events/jobs must be retry-safe without duplicate financial mutations.

### Observability

- Provide structured production logs with request correlation IDs.
- Health/readiness checks must cover the API and critical dependencies.
- Monitor latency, errors, saturation, authentication failures, queues, jobs, and transfers.
- Route actionable alerts to an accountable owner.
- Redact credentials, tokens, cookies, and sensitive file content from logs.

### Maintainability

- Keep permissions, event names, and response contracts centralized.
- Deliver schema changes through reviewed Prisma migrations.
- Follow existing separation between routes, validation, policies, persistence, and contracts.
- Pull requests must pass formatting, linting, type checking, builds, and required tests.

## 12. Analytics and reporting

Phase 1 derives dashboard information from operational APIs. A later reporting layer should use immutable event semantics and historical snapshots so that past metrics do not change when source records are edited.

Priority reports include lead conversion by source/owner, follow-up timeliness, candidates by stage and time-in-stage, invoiced/collected/outstanding value, expenses by category/vendor/status, and user/audit activity.

## 13. Dependencies and assumptions

- Users have modern browsers and reliable connectivity.
- PostgreSQL is the system of record; Redis is available for production background work.
- Owners will approve role mappings, retention rules, and finance workflows before launch.
- An approved delivery provider is required for password recovery and outbound notifications.
- Managed object storage and malware scanning are required for production file handling at scale.
- Phase 1 finance is operational billing/expense tracking, not a statutory accounting ledger.

## 14. Risks and mitigations

| Risk                                                                  | Impact                           | Mitigation                                                     |
| --------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------- |
| Default credentials or development secrets reach a shared environment | Account compromise               | Managed secrets, deployment checks, mandatory rotation         |
| Role configuration grants excessive access                            | Sensitive data exposure          | Approved matrix, least privilege, audits, authorization tests  |
| Count-based human-readable codes collide under concurrency            | Failed/duplicate record creation | Database sequences or retry-safe allocation                    |
| Local storage is lost or cannot scale horizontally                    | Lost or unavailable files        | Managed object storage, backups, checksums, lifecycle policies |
| Uploaded content is not malware-scanned                               | Endpoint/user compromise         | Scanner integration, quarantine, restricted types              |
| Financial statuses become stale                                       | Incorrect decisions              | Overdue jobs, reconciliation checks, ownership alerts          |
| Operational tables are treated as analytics history                   | Unreliable trends                | Event/snapshot reporting model and metric definitions          |
| Missing automated coverage causes regressions                         | Release instability              | Unit, integration, authorization, and E2E suites               |

## 15. Delivery plan

### Milestone 1 — Foundation (current)

- Monorepo, shared contracts, authentication, RBAC, schema, and migrations
- Dashboard plus CRM, recruitment, finance, file, user, and role workflows
- Audit writes, real-time event foundation, and Redis/BullMQ foundation

### Milestone 2 — Pilot readiness

- Unit/integration tests for auth, permissions, finance rules, and file policy
- End-to-end tests for each persona's critical path
- Searchable audit logs and in-app notifications
- Password recovery and single-use reset tokens
- Workers for reminders, overdue invoices, and retention cleanup
- Concurrency-safe business-code generation
- Accessibility and performance review

### Milestone 3 — Production readiness

- Managed object storage, direct uploads, malware scanning, quarantine
- Production deployment, secrets, backups, restore test, metrics, and alerts
- Security review, dependency scanning, penetration test, incident runbook
- Import plan, pilot training, support ownership, and rollback plan

### Milestone 4 — Optimization

- Advanced filtering, saved views, exports, historical reporting, configurable workflows
- Approved third-party integrations and delivery channels
- KPI review using pilot data and prioritized automation

## 16. Acceptance criteria

Phase 1 is accepted for an internal pilot when:

1. A seeded admin can sign in, create a user, assign a role, and sign out.
2. Each persona can access permitted modules and receives 403 for forbidden API actions.
3. Sales can create, search, update, and archive a lead and complete a follow-up.
4. Recruitment can create a job/candidate and move the candidate through authorized stages.
5. Finance can create a customer/invoice, record valid payments, and cannot overpay.
6. An approver can approve/reject an expense; an unauthorized user cannot.
7. An authorized user can upload, download, and soft-delete allowed files; invalid files fail clearly.
8. Significant operations create expected audit records and real-time events.
9. The dashboard reveals no data from modules the user cannot view.
10. Type checks, lint, formatting checks, and production builds pass cleanly.
11. No critical security or data-integrity defect remains open.

Production launch additionally requires applicable Milestone 2 and 3 controls, including automated test gates, recovery workflows, workers, managed storage, scanning, backups, monitoring, and security review.

## 17. Open decisions

1. Which legal entities, regions, currencies, time zones, and tax regimes are required?
2. Is the product single-organization, or must it isolate multiple tenants/companies?
3. What retention periods apply to audit logs, applicants, finance records, and files?
4. Which storage, email, identity, accounting, and messaging providers are approved?
5. Which roles may see salary, candidate, customer, tax, and invoice data?
6. What thresholds or multi-step approvals apply to expenses and future procurement?
7. Which pilot reports are mandatory, and how is each KPI defined?
8. What availability, RPO, and RTO commitments are required for production?

## 18. Change control

Material changes to scope, roles, finance rules, retention, integrations, or acceptance criteria should create a new document version with named approvers. Implementation work should remain traceable to this PRD's requirement IDs.
