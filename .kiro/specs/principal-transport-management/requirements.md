# Requirements Document

## Introduction

Principal Transport Management extends the existing transport module so that a user with the `principal` role can fully manage transport operations for their school (school context DEMO001) and communicate with the people that transport serves. The feature reuses the existing transport models (`Vehicle`, `Driver`, `TransportRoute`, `TransportStop`, `StudentTransport`, `TransportFee`, `SOSAlert`), the existing fee models (`FeeInstallment`, `FeeStructure`, `FeePayment`), and the existing notification infrastructure (`Notification`, `GET /api/global/notifications` polled every 30 seconds by the header bell, and the broadcast pattern that writes one `Notification` row per recipient user).

The feature adds five capability areas on top of the existing CRUD:

1. Granting the `principal` role write access alongside the current `school_admin` and `transport_manager` roles.
2. Managing student opt-in transport assignments.
3. Displaying transport fees side-by-side with school fees in the student fee view, without writing to the main fee ledger.
4. Raising emergency transport alerts that auto-open a blocking, full-screen modal with sound for targeted recipients, delivered through the existing 30-second polling.
5. Sending normal transport trip notifications that appear in the existing notification bell.
6. Targeting either a specific bus/route audience or the whole school for both normal and emergency messages.
7. Showing "My Bus" information (bus number, driver name, driver phone) to a student scoped only to the route serving that student, and to the principal for any route.
8. Providing a principal-only Transport management UI.

This is an additive change: existing transport access for `school_admin` and `transport_manager`, and the existing fee ledger, MUST remain unchanged.

## Glossary

- **System**: The School CRM backend application (Flask) and its React frontend.
- **Principal**: A user whose role name is `principal`, scoped to a single school tenant via `school_id`.
- **Transport_Manager**: A user whose role name is `transport_manager` (existing role with transport write access).
- **School_Admin**: A user whose role name is `school_admin` (existing role with transport write access).
- **Transport_Write_Endpoint**: Any existing transport API endpoint under `transport_bp` that creates, updates, or deletes transport data and is currently gated by `@role_required('school_admin', 'transport_manager')` or `@role_required('school_admin')`.
- **Opted_In_Student**: A `Student` who has an active `StudentTransport` row (status `active`) linking that student to a `TransportRoute` and `TransportStop`.
- **Transport_Fee**: A `TransportFee` row applicable to an Opted_In_Student via the student's assigned route/stop.
- **Fee_Ledger**: The main fee accounting records stored in `FeeInstallment` and `FeePayment`.
- **Notification_Bell**: The header notification component in `frontend/src/components/layout/DashboardLayout.js` that polls `GET /api/global/notifications` every 30 seconds.
- **Normal_Transport_Notification**: A `Notification` row of standard in-app type created for a transport trip event (for example "bus reached school", "bus left school", "bus won't come today") that appears in the Notification_Bell.
- **Emergency_Transport_Alert**: A transport notification flagged as emergency that causes a blocking full-screen modal with sound on recipient devices.
- **Emergency_Modal**: The full-screen, auto-opening, blocking modal with sound rendered on a recipient's device when an unacknowledged Emergency_Transport_Alert is delivered.
- **Acknowledge_Endpoint**: The API endpoint a recipient calls to mark an Emergency_Transport_Alert as acknowledged so the Emergency_Modal closes.
- **Target_Audience**: The selected recipients for a notification, either a specific bus/route (students and staff associated with that `TransportRoute` via `StudentTransport`) or school-wide (all active users).
- **Route_Recipients**: The set of active users associated with a `TransportRoute`, derived from `StudentTransport` rows whose `route_id` equals the target route (students linked via `Student.user_id`, plus the route's assigned driver where a linked user exists).
- **My_Bus_Info**: The view that shows bus number (vehicle), driver name, and driver phone for the route serving a given student.
- **Principal_Transport_UI**: The Transport section in the principal area of the frontend used to manage transport data and trigger notifications and emergencies.

## Requirements

### Requirement 1: Principal Write Access to Transport

**User Story:** As a Principal, I want full create, view, update, and delete control over all transport data, so that I can manage transport operations without needing a separate transport manager.

#### Acceptance Criteria

1. THE System SHALL grant the `principal` role access to every Transport_Write_Endpoint in addition to the existing `school_admin` and `transport_manager` roles.
2. THE System SHALL retain `school_admin` and `transport_manager` access to every Transport_Write_Endpoint that those roles can currently access.
3. WHEN a Principal sends a create, update, or delete request to a Transport_Write_Endpoint for transport data belonging to the Principal's school, THE System SHALL process the request and return the same success response shape returned for `school_admin`.
4. WHERE a Transport_Write_Endpoint is currently restricted to `school_admin` only (vehicle delete, driver delete, route delete), THE System SHALL also grant `principal` access to that endpoint.
5. IF a Principal sends a request to a Transport_Write_Endpoint for a `school_id` other than the Principal's own school, THEN THE System SHALL reject the request and return an HTTP 403 or 404 response without modifying data.
6. WHILE the `transport` feature is disabled for the Principal's school, THE System SHALL reject Principal transport requests on feature-gated endpoints with an HTTP 403 response, consistent with the existing `feature_required('transport')` behavior.

---

### Requirement 2: Student Transport Opt-In Assignment Management

**User Story:** As a Principal, I want to assign and unassign students to a route and bus, so that only opted-in students are recognized as transport users.

#### Acceptance Criteria

1. WHEN a Principal assigns a student to transport, THE System SHALL create a `StudentTransport` row containing `student_id`, `school_id`, `route_id`, and `stop_id`, and SHALL set its status to `active`.
2. WHEN a Principal updates a student transport assignment, THE System SHALL update the assignment's `route_id`, `stop_id`, `pickup_type`, or `status` for assignments belonging to the Principal's school.
3. WHEN a Principal unassigns a student, THE System SHALL set the corresponding `StudentTransport` status to a non-active value so that the student is no longer an Opted_In_Student.
4. THE System SHALL treat only students with an active `StudentTransport` row as Opted_In_Students for transport fee display, My_Bus_Info, and route-targeted notifications.
5. IF a Principal submits a transport assignment without `student_id`, `route_id`, or `stop_id`, THEN THE System SHALL reject the request with an HTTP 400 validation error.
6. WHEN a Principal lists student transport assignments, THE System SHALL return assignments scoped to the Principal's school and SHALL support filtering by `route_id`.

---

### Requirement 3: Transport Fee Display Alongside School Fees

**User Story:** As a student, I want to see my transport fee next to my school fees, so that I understand my total cost without confusion about which fees are which.

#### Acceptance Criteria

1. WHEN an Opted_In_Student opens the student fee view, THE System SHALL return the student's school fee data from the Fee_Ledger and the student's applicable Transport_Fee as separate, clearly labeled sections in the same response.
2. THE System SHALL determine an Opted_In_Student's applicable Transport_Fee from the `TransportFee` records matching the route or stop on the student's active `StudentTransport` row.
3. THE System SHALL NOT create, update, or delete any `FeeInstallment` or `FeePayment` row when displaying a Transport_Fee.
4. WHERE a student has no active `StudentTransport` row, THE System SHALL return the school fee data with no Transport_Fee section or an empty Transport_Fee section.
5. WHERE an Opted_In_Student has an active assignment but no matching `TransportFee` record exists, THE System SHALL return the school fee data and indicate that no transport fee amount is configured.
6. THE System SHALL present the school fee total and the transport fee as distinct amounts so that the transport fee is not added into the Fee_Ledger totals (`total`, `paid`, `pending`).

---

### Requirement 4: Emergency Transport Alert

**User Story:** As a Principal, I want to raise an emergency transport alert that immediately interrupts recipients, so that urgent transport situations reach people without delay.

#### Acceptance Criteria

1. WHEN a Principal raises an Emergency_Transport_Alert, THE System SHALL create one `Notification` row per recipient in the Target_Audience with a flag or type value that identifies the notification as an emergency.
2. WHEN the Notification_Bell polling cycle (every 30 seconds) returns an unacknowledged Emergency_Transport_Alert for the current user, THE System SHALL cause the recipient's frontend to auto-open the Emergency_Modal with sound.
3. WHILE an Emergency_Transport_Alert for the current user is unacknowledged, THE System SHALL keep the Emergency_Modal open and blocking so that the recipient cannot dismiss it without acknowledging.
4. WHEN a recipient acknowledges the Emergency_Modal, THE System SHALL call the Acknowledge_Endpoint, mark that recipient's Emergency_Transport_Alert as acknowledged, and close the Emergency_Modal.
5. WHILE an Emergency_Transport_Alert has been acknowledged by a recipient, THE System SHALL NOT re-open the Emergency_Modal for that recipient on subsequent polling cycles.
6. THE System SHALL deliver Emergency_Transport_Alerts using the existing 30-second polling mechanism and SHALL NOT require WebSocket connections.
7. THE System SHALL restrict raising an Emergency_Transport_Alert to the `principal`, `school_admin`, and `transport_manager` roles.

---

### Requirement 5: Normal Transport Trip Notifications

**User Story:** As a Principal, I want to send routine transport notifications, so that students and staff know the status of their bus.

#### Acceptance Criteria

1. WHEN a Principal sends a Normal_Transport_Notification, THE System SHALL create one in-app `Notification` row per recipient in the Target_Audience.
2. THE System SHALL make each Normal_Transport_Notification appear in the recipient's Notification_Bell through the existing `GET /api/global/notifications` response.
3. THE System SHALL accept a message describing the trip event (for example "bus reached school", "bus left school", "bus won't come today") and store that message text on each recipient's `Notification` row.
4. THE System SHALL NOT cause the Emergency_Modal to open for a Normal_Transport_Notification.
5. WHEN a recipient reads a Normal_Transport_Notification, THE System SHALL update its read state using the existing mark-as-read endpoints so that the unread count decreases.

---

### Requirement 6: Notification and Emergency Targeting

**User Story:** As a Principal, I want to choose whether a message goes to one bus/route or the whole school, so that I only alert the people who need the information.

#### Acceptance Criteria

1. WHEN a Principal selects a specific bus/route as the Target_Audience, THE System SHALL resolve Route_Recipients from active `StudentTransport` rows whose `route_id` matches the selected route and SHALL create notification rows only for those recipients.
2. WHEN a Principal selects school-wide as the Target_Audience, THE System SHALL create notification rows for all active users in the Principal's school.
3. THE System SHALL apply the same Target_Audience selection options to both Normal_Transport_Notifications and Emergency_Transport_Alerts.
4. IF a Principal selects a specific route that has no active `StudentTransport` recipients, THEN THE System SHALL complete the request and report that zero recipients were notified.
5. THE System SHALL scope all resolved recipients to the Principal's school so that no user from another school tenant receives the notification.
6. IF a Principal submits a notification without a valid Target_Audience selection, THEN THE System SHALL reject the request with an HTTP 400 validation error.

---

### Requirement 7: My Bus Information

**User Story:** As a student, I want to see my bus number, driver name, and driver phone, so that I can identify and contact my assigned transport, while not seeing details of buses that are not mine.

#### Acceptance Criteria

1. WHEN an Opted_In_Student opens My_Bus_Info, THE System SHALL return the bus number, driver name, and driver phone for the `Vehicle` and `Driver` associated with the route on that student's active `StudentTransport` row.
2. THE System SHALL restrict the My_Bus_Info response for a student to only the route serving that student so that no other route's bus or driver details are returned.
3. WHERE a student has no active `StudentTransport` row, THE System SHALL return an empty or "no transport assigned" My_Bus_Info response.
4. WHEN a Principal views My_Bus_Info, THE System SHALL allow the Principal to view bus number, driver name, and driver phone for any route within the Principal's school.
5. WHERE the route serving a student has no assigned `Vehicle` or `Driver`, THE System SHALL return the available fields and omit or null the missing bus number, driver name, or driver phone.
6. THE System SHALL source the bus number from the route's `Vehicle.vehicle_number` and the driver name and phone from the route's `Driver.name` and `Driver.phone`.

---

### Requirement 8: Principal Transport Management UI

**User Story:** As a Principal, I want a dedicated Transport section in my area, so that I can manage transport data and send notifications from one place.

#### Acceptance Criteria

1. WHERE the logged-in user is a Principal and the `transport` feature is enabled, THE System SHALL display a Transport section in the Principal_Transport_UI.
2. THE Principal_Transport_UI SHALL provide controls to view, add, and update routes, vehicles, drivers, student assignments, and transport fees using the existing transport endpoints.
3. THE Principal_Transport_UI SHALL provide a control to send a Normal_Transport_Notification with a Target_Audience selection.
4. THE Principal_Transport_UI SHALL provide a control to raise an Emergency_Transport_Alert with a Target_Audience selection.
5. WHEN a Principal triggers a transport action from the Principal_Transport_UI, THE System SHALL call the corresponding transport or notification endpoint and display the success or error result to the Principal.
6. THE Principal_Transport_UI SHALL allow the Principal to view My_Bus_Info for a selected route within the Principal's school.
