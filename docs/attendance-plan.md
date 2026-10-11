# Attendance Management Module (Week 7)

## Purpose
Record and monitor daily employee attendance, and show who is present, late or absent.

## Attendance record (data structure)

| Field | Type | Notes |
|---|---|---|
| employee | reference to Employee | required |
| date | text `YYYY-MM-DD` | required, real calendar date, cannot be in the future |
| checkIn | text `HH:MM` | optional |
| checkOut | text `HH:MM` | optional, must be after check-in |
| status | present / late / absent | if left empty it is worked out automatically |

One employee can have only **one record per day** (unique index on employee + date).

## Rules
- Status is automatic when not chosen: no check-in = absent; check-in after `LATE_AFTER`
  (default 09:15) = late; otherwise present.
- Check-out needs a check-in, and must be later than it.
- An absent record cannot have check-in / check-out times.

## API (admin and hr only)

| Method | Route | What it does |
|---|---|---|
| GET | `/api/attendance?date=YYYY-MM-DD` | all active employees for that day with their record + summary counts |
| POST | `/api/attendance` | create or update an employee's record for a day |
| DELETE | `/api/attendance/:id` | clear a record |

`GET /api/dashboard/stats` also returns today's present / late / absent / not-marked counts.

## Interface
- **Attendance page:** pick a date, see the summary cards and a table of active employees.
  Each row can be marked or edited (check-in, check-out, status) and cleared.
- **Dashboard:** "Today's Attendance" cards.

## Integration with employee records
Attendance rows are built from the active employees list, so a new employee appears on the
attendance page automatically, and inactive employees are left out.

## Still to do (next weeks)
- Employee self check-in / check-out
- Monthly attendance history per employee
- Attendance reports
