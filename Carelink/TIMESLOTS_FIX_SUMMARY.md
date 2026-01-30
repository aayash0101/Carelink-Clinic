# Time Slots End-to-End Fix Summary

## Issues Fixed

### 1. **Buggy Weekday Calculation** ✅
- **Problem**: `RangeError: Value lowercase out of range for Date.prototype.toLocaleDateString options property weekday`
- **Root Cause**: Using invalid Intl locale value `'lowercase'` in `toLocaleDateString()`
- **Solution**: Replaced with manual day-of-week calculation using array lookup
  ```javascript
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dayOfWeek = days[date.getDay()];
  ```

### 2. **Missing Availability Field in DoctorProfile Schema** ✅
- **Problem**: `strict: 'throw'` prevented `doctorProfile.availability` from being stored
- **Solution**: Added `availability` field to DoctorProfile schema with complete structure:
  ```javascript
  availability: {
    days: [String] (default: [], validated against day names),
    startTime: String (HH:mm format, default: '09:00'),
    endTime: String (HH:mm format, default: '17:00'),
    slotDuration: Number (15-240 minutes, default: 30)
  }
  ```
- Added pre-validate hook to ensure `endTime > startTime`

### 3. **Defensive getAvailableSlots Implementation** ✅
- All error paths now return HTTP 200 with slots=[] instead of 500 errors
- Handles missing/empty availability gracefully
- Validates time formats before parsing
- Ensures endTime > startTime before generating slots

### 4. **Availability Update Endpoint** ✅
- Added `PUT /api/doctors/:userId/availability` (admin-protected)
- Full CSRF protection and authorization checks
- Validates all input (days, times, duration)

---

## Modified Files

### 1. **backend/models/DoctorProfile.js**
- Added `availability` field with days, startTime, endTime, slotDuration
- Added pre-validate hook for time validation
- Maintained `strict: 'throw'` setting

### 2. **backend/controllers/slotController.js**
- Added `getDayOfWeek()` helper function (replaces buggy locale code)
- Enhanced `getAvailableSlots()` with defensive checks
- All error paths return HTTP 200 JSON (never 500)
- Validates doctor schedule configuration before processing
- Proper date/time handling using local time

### 3. **backend/controllers/doctorController.js**
- Added `updateDoctorAvailability()` export
- Validates request body (days, startTime, endTime, slotDuration)
- Saves availability to DoctorProfile.availability

### 4. **backend/routes/doctors.js**
- Added existing `getDoctor` route (GET /api/doctors/:id)
- Added new route: `PUT /api/doctors/:userId/availability`
- Applied auth.protect, auth.authorize('admin'), csrf.verifyToken middleware

### 5. **backend/routes/slots.js**
- No changes needed (already correctly configured)

---

## Data Model

```javascript
DoctorProfile = {
  userId: ObjectId,
  departmentId: ObjectId,
  qualifications: String,
  experienceYears: Number,
  consultationFee: Number,
  availability: {
    days: ['monday', 'tuesday', ...],  // lowercase day names
    startTime: '09:00',                 // HH:mm format
    endTime: '17:00',                   // HH:mm format
    slotDuration: 30                    // minutes (15-240)
  },
  isActive: Boolean
}
```

---

## Test Commands

### 1. Get Available Slots (Public API)
```bash
curl.exe -i "http://localhost:5000/api/slots?doctorId=<USER_ID>&date=2026-01-30"
```
**Expected Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "start": "2026-01-30T09:00:00.000Z",
        "end": "2026-01-30T09:30:00.000Z",
        "duration": 30,
        "displayTime": "09:00 AM"
      }
    ],
    "doctor": {
      "availability": {
        "days": ["monday", "tuesday", "wednesday"],
        "startTime": "09:00",
        "endTime": "17:00",
        "slotDuration": 30
      }
    }
  }
}
```

### 2. No Schedule Set (Defensive Response)
```bash
curl.exe -i "http://localhost:5000/api/slots?doctorId=<USER_ID_NO_SCHEDULE>&date=2026-01-30"
```
**Expected Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "slots": [],
    "message": "Doctor schedule not set",
    "doctor": { "availability": {} }
  }
}
```

### 3. Doctor Not Available on Date
```bash
curl.exe -i "http://localhost:5000/api/slots?doctorId=<USER_ID>&date=2026-02-01"
```
**Expected Response (HTTP 200) if 2026-02-01 is Sunday (not in schedule):**
```json
{
  "success": true,
  "data": {
    "slots": [],
    "message": "Doctor not available on this day",
    "doctor": { "availability": {...} }
  }
}
```

### 4. Update Doctor Availability (Admin API)
**Step 1: Get CSRF Token**
```bash
curl.exe -i "http://localhost:5000/api/departments"
```
Copy the `csrf-token` from the response headers.

**Step 2: Update Availability**
```bash
curl.exe -X PUT ^
  -H "Content-Type: application/json" ^
  -H "X-CSRF-Token: <CSRF_TOKEN>" ^
  -H "Authorization: Bearer <JWT_TOKEN>" ^
  -d @- ^
  "http://localhost:5000/api/doctors/<USER_ID>/availability" << EOF
{
  "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "startTime": "09:00",
  "endTime": "18:00",
  "slotDuration": 30
}
EOF
```

**Expected Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "_id": "<USER_ID>",
      "availability": {
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "startTime": "09:00",
        "endTime": "18:00",
        "slotDuration": 30
      }
    }
  }
}
```

### 5. Invalid Request Scenarios

**Missing doctorId:**
```bash
curl.exe -i "http://localhost:5000/api/slots?date=2026-01-30"
```
Response: HTTP 400, `doctorId and date are required`

**Invalid date format:**
```bash
curl.exe -i "http://localhost:5000/api/slots?doctorId=<USER_ID>&date=30-01-2026"
```
Response: HTTP 400, `Invalid date format. Use YYYY-MM-DD`

**Doctor not found:**
```bash
curl.exe -i "http://localhost:5000/api/slots?doctorId=507f1f77bcf86cd799439011&date=2026-01-30"
```
Response: HTTP 404, `Doctor not found`

---

## Security Features Maintained

✅ CSRF protection on availability update (PUT endpoint)  
✅ JWT authentication on availability update  
✅ Admin authorization check on availability update  
✅ Input validation (days, times, durations)  
✅ Mongoose schema validation (`strict: 'throw'`)  
✅ Time format validation using regex  
✅ Array validation for days (only lowercase day names)  
✅ No exposure of sensitive data in error responses  

---

## Backward Compatibility

- GET /api/slots endpoint remains public (no changes to security)
- Response format unchanged
- All existing queries continue to work
- New availability field is optional (existing doctors will have empty availability)

---

## Testing Checklist

- [ ] Test valid slot retrieval (HTTP 200, slots array populated)
- [ ] Test doctor with no schedule (HTTP 200, slots=[], message displayed)
- [ ] Test doctor unavailable on date (HTTP 200, slots=[], message displayed)
- [ ] Test update availability as admin (HTTP 200, availability saved)
- [ ] Test update without CSRF token (HTTP 403)
- [ ] Test update without auth (HTTP 401)
- [ ] Test invalid days array (HTTP 400)
- [ ] Test invalid time format (HTTP 400)
- [ ] Test endTime <= startTime (HTTP 400)
- [ ] Test slot duration out of range (HTTP 400)
- [ ] Verify no 500 errors on slot retrieval

