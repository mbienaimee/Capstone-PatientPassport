# Doctor Login and Patient List Test

## Test Scenario: Doctor Login Redirect to Patient List

### Prerequisites
1. Backend server is running
2. Database has test data (patients and doctors)
3. Frontend development server is running

### Test Steps

#### 1. Doctor Login Test
1. Navigate to `/doctor-login`
2. Enter valid doctor credentials:
   - Email: `doctor@example.com`
   - Password: `password123`
3. Click "Login"
4. **Expected Result**: 
   - Success notification appears: "Welcome back! Redirecting to patient list..."
   - After 1 second, redirects to `/doctor-dashboard`

#### 2. Patient List Display Test
1. After successful login, verify the dashboard loads
2. **Expected Results**:
   - Header shows "Doctor Dashboard"
   - Stats cards show patient counts
   - Patient list table displays all patients from database
   - Each patient row shows: Name, National ID, Email, Contact, Age, Status, Address
   - "Request OTP Access" button is available for each patient

#### 3. Search and Filter Test
1. Use the search box to search by:
   - Patient name
   - National ID
   - Email address
2. Use the status filter to show:
   - All patients
   - Active patients only
   - Inactive patients only
3. **Expected Results**:
   - Search filters results in real-time
   - Filter updates results immediately
   - Results summary shows correct counts

#### 4. Pagination Test
1. If there are more than 10 patients, verify pagination works
2. **Expected Results**:
   - Page numbers appear at bottom
   - Previous/Next buttons work
   - Page numbers are clickable
   - Results summary shows correct range

#### 5. Refresh Test
1. Click the "Refresh" button
2. **Expected Results**:
   - Button shows "Refreshing..." with spinning icon
   - Data reloads from database
   - Button returns to normal state

#### 6. Patient Access Test
1. Click "Request OTP Access" on any patient
2. **Expected Results**:
   - OTP modal opens
   - Can request access to patient passport
   - Modal can be cancelled

### Error Handling Tests

#### 1. No Patients Test
1. If database has no patients
2. **Expected Result**: Shows "No patients registered" message with appropriate icon

#### 2. Search No Results Test
1. Search for non-existent patient
2. **Expected Result**: Shows "No patients found" with suggestion to adjust search criteria

#### 3. Network Error Test
1. Disconnect network or stop backend
2. Click refresh
3. **Expected Result**: Gracefully handles error, shows empty state

### Success Criteria
- [ ] Doctor login redirects to patient list
- [ ] Patient list loads all patients from database
- [ ] Search functionality works correctly
- [ ] Filter functionality works correctly
- [ ] Pagination works for large datasets
- [ ] Refresh functionality works
- [ ] Error states are handled gracefully
- [ ] UI is responsive and user-friendly
- [ ] Loading states are properly displayed

### Notes
- Test with different user roles to ensure only doctors can access
- Verify authentication is maintained throughout the session
- Check that patient data is properly formatted and displayed
- Ensure all interactive elements are accessible and functional

