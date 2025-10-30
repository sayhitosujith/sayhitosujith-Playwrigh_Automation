# User List Management — Test Plan

## Executive summary
This document defines a comprehensive test plan for the "User List / User Management" feature of the application. It covers primary user journeys (viewing users, adding, editing, deleting, bulk operations), error handling, edge cases, permissions, import/export, performance and accessibility checks. Each scenario is detailed with explicit steps, expected results, assumptions, success criteria, and failure conditions. The plan assumes a fresh test state unless noted otherwise.

Assumptions:
- Tests run against a test environment (QA) with seeded test accounts and a resettable database.
- Test user(s) have the appropriate roles (Admin, Manager, Viewer) as described in scenarios.
- The application URL for user management is reachable and the tester can authenticate.
- Browser state is fresh for each scenario (no cached auth unless scenario requires it).

Test data (examples):
- Admin: admin@example.com / Password123!
- Manager: manager@example.com / Password123!
- Viewer: viewer@example.com / Password123!
- New User sample payload:
  - First name: Test
  - Last name: User
  - Email: test.user+<timestamp>@example.com
  - Role: Viewer
  - Status: Active

Success criteria (global):
- UI actions produce expected visible changes and API calls succeed (HTTP 2xx).
- Changes persist when appropriate (e.g., created user appears in list after refresh).
- No uncaught console errors, modals or UI glitches during flows.

## Primary user journeys
- Admin: Full CRUD on users, role assignment, import/export, bulk operations.
- Manager: Create and edit users, but cannot delete admin users (depending on app rules).
- Viewer: Read-only access to user list and details.

## Test scenarios
Each scenario below assumes a fresh session and an authenticated user of the appropriate role unless the scenario states otherwise.

### 1. View User List (Happy Path)
Assumption: Signed in as Admin.
Steps:
1. Navigate to the User Management page (e.g., /admin/users).
2. Observe user table loads within 5s.
3. Verify table headers: Name, Email, Role, Status, Actions.
4. Click a user row to open details pane/modal.
Expected results:
- Table shows users with correct columns.
- At least one user is displayed.
- Details pane opens and displays user fields.
Success criteria:
- Table loads and rows are accessible.
Failure condition:
- Table fails to load, empty state shown incorrectly, or 500 error.

### 2. Add New User (Happy Path)
Assumption: Signed in as Admin.
Steps:
1. Click "Add user" button.
2. Fill required fields with valid values (use unique email).
3. Submit the form.
4. Wait for success notification and ensure modal closes.
5. Refresh or re-query list and search for the new email.
Expected results:
- Success message shown.
- New user appears in the user list.
- Email uniqueness validation prevented duplicates.
Success criteria:
- New user present and fields match input.
Failure condition:
- Form submission returns error or user not created.

### 3. Add User — Validation Errors (Negative)
Assumption: Signed in as Admin.
Steps:
1. Open Add User form.
2. Leave required fields empty and submit.
3. Enter invalid email and submit.
4. Enter weak password (if required) and submit.
Expected results:
- Inline validation messages for required fields and invalid email.
- Submit prevented until validation passes.
Success criteria:
- Proper error messages and no user created.
Failure condition:
- App accepts invalid data or shows generic server error.

### 4. Edit Existing User
Assumption: Signed in as Admin; a user exists to edit.
Steps:
1. Locate a user in the list and click Edit.
2. Change first/last name and role.
3. Submit changes.
4. Verify success message and updated row values.
Expected results:
- Edits are persisted and visible in list and details.
Success criteria:
- Updated user details match inputs.
Failure condition:
- Changes not saved, or wrong fields updated.

### 5. Delete a User (Single delete)
Assumption: Signed in as Admin; target user is deletable.
Steps:
1. Click Delete action for a user.
2. Confirm deletion in confirmation dialog.
3. Verify success message and ensure user is removed from the list.
Expected results:
- Confirmation prompt appears.
- User no longer present in list.
Success criteria:
- User deleted and cannot be found by searching.
Failure condition:
- Deletion fails silently or critical users can be deleted unexpectedly.

### 6. Bulk Delete / Bulk Actions
Assumption: Signed in as Admin.
Steps:
1. Select multiple users with checkboxes.
2. Click Bulk Delete (or Bulk Action) and confirm.
3. Verify users removed and success notification shown.
Expected results:
- Bulk operation processes all selected users.
- Partial failures provide per-item feedback.
Success criteria:
- All deletable users removed; non-deletable items reported.
Failure condition:
- Only a subset deleted without explanation, or UI hangs.

### 7. Search / Filter / Sort
Assumption: Signed in as any role with read access.
Steps:
1. Use the search box to search by name/email.
2. Apply filters for Role and Status.
3. Sort by Name and Email columns.
Expected results:
- Search and filters update list and are reflected in URL or state.
- Sorting applies in ascending/descending order.
Success criteria:
- Accurate results for search/filter and stable sorting.
Failure condition:
- Wrong or no results, or UI shows inconsistent ordering.

### 8. Pagination / Infinite Scroll
Assumption: Large dataset present.
Steps:
1. Navigate to later pages or scroll to trigger infinite load.
2. Verify previously seen pages retain state.
Expected results:
- New pages load within acceptable time (under ~3s per page).
- Page controls work and page numbers are correct.
Success criteria:
- No duplicate rows; navigation stable.
Failure condition:
- Missing items, duplicates, or broken navigation links.

### 9. Import Users (CSV) — Happy Path
Assumption: Signed in as Admin; CSV file format documented.
Steps:
1. Click Import and upload a valid CSV with multiple users.
2. Map columns if prompted and start import.
3. Wait for import success and verify users created.
Expected results:
- Import progress and final success message.
- Imported users appear in the list.
Success criteria:
- All valid rows imported; invalid rows reported with line numbers.
Failure condition:
- Silent failure, partial imports with no feedback.

### 10. Import Users — Error Handling
Steps:
1. Upload malformed CSV (missing required fields, duplicate emails).
Expected results:
- Clear error messages and no corrupt data added.
Success criteria:
- Import aborted or partial import with clear itemized errors.
Failure condition:
- Corrupt or incomplete data added to DB.

### 11. Export Users (CSV)
Assumption: Signed in as Admin or Manager with export permission.
Steps:
1. Click Export and download CSV.
2. Open CSV and verify header and expected number of rows.
Expected results:
- File downloads and is parsable with expected fields.
Success criteria:
- Data matches UI content and includes expected fields.
Failure condition:
- Export fails, missing columns, or contains PII beyond allowed scope.

### 12. Role & Permission Enforcement
Assumption: Users exist for Admin, Manager, Viewer roles.
Steps:
1. Log in as Manager and attempt to delete an Admin.
2. Log in as Viewer and attempt to access add/edit/delete actions.
Expected results:
- Forbidden actions blocked (UI hides buttons or server returns 403).
Success criteria:
- Enforcement consistent across UI and API.
Failure condition:
- Unauthorized actions succeed.

### 13. Audit / Activity Trail (if available)
Steps:
1. Perform create/edit/delete operations.
2. Verify audit logs reflect actor, timestamp, and change.
Expected results:
- Entries exist and are accurate.
Failure condition:
- Missing or incomplete audit entries.

### 14. Concurrency / Race Conditions
Steps:
1. In two sessions, edit the same user concurrently.
2. Save from both sessions and observe conflict resolution.
Expected results:
- App handles concurrent edits (versioning, merge UI or conflict warning).
Failure condition:
- Silent overwrites without notification.

### 15. Performance & Load (smoke)
Steps:
1. Load the user list page and measure time to first meaningful paint and table load.
2. Perform bulk import with large CSV (~5k rows) in a non-blocking test environment.
Expected results:
- Page loads in acceptable time (configurable threshold, e.g., <3s small dataset).
- Import handled by background job and UI informs when complete.
Failure condition:
- Timeouts, 5xx, or the UI becomes unresponsive.

### 16. Accessibility Checks
Steps:
1. Run automated a11y scan (axe/lighthouse) on User List and User Form pages.
2. Test keyboard-only navigation, ARIA labels, and color contrast manually.
Expected results:
- No critical a11y violations.
Failure condition:
- Blocker-level contrast/label issues or inability to operate by keyboard.

### 17. Localization / Internationalization
Steps:
1. Switch to supported locales and verify UI strings and date formats.
2. Create a user with non-ASCII characters in name.
Expected results:
- UI renders localized strings and special characters correctly.
Failure condition:
- Broken layouts or corrupted characters.

## Environment & Pre-conditions
- Use a dedicated test environment with a reset endpoint or DB snapshot.
- Provide a test admin account and non-admin accounts.
- Test data cleanup: prefer marking test accounts as deleted or using a test tenant.

## Test execution notes
- Run tests independently and in random order to ensure idempotence.
- For API-assisted checks, verify response status codes and response bodies.
- Capture screenshots and logs on failures.

## Post-conditions & Cleanup
- Remove or flag created test users to avoid polluting production-like data.
- Reset environment if persistent changes are not desired.

## Quick checklist for each scenario
1. Preconditions satisfied (role, fresh state).
2. Steps executed exactly as written.
3. Observe expected results.
4. Record any discrepancy, API error codes, or console errors.
5. Clean up created entities.

## Appendix — Sample test matrix (short)
- Admin: View, Add, Edit, Delete, Import, Export, Audit
- Manager: View, Add, Edit, Export
- Viewer: View only

---
End of test plan.
