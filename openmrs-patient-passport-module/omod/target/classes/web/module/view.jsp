<%@ include file="/WEB-INF/template/include.jsp" %>
<%@ include file="/WEB-INF/template/header.jsp" %>

<openmrs:require privilege="Patient Passport: View Patient Passport" otherwise="/login.htm" redirect="/module/patientpassport/view.htm?patientId=${param.patientId}" />

<c:set var="patientId" value="${param.patientId}" />

<div class="patientpassport-container">
    <div class="patientpassport-header">
        <h2>
            <spring:message code="patientpassport.title" />
            - ${patient.personName.fullName}
        </h2>
        <div class="patientpassport-actions">
            <c:if test="${hasPassport}">
                <c:if test="${otpEnabled}">
                    <button id="requestOtpBtn" class="btn btn-primary">
                        <i class="icon-lock"></i> Request OTP Access
                    </button>
                </c:if>
                <button id="emergencyAccessBtn" class="btn btn-danger">
                    <i class="icon-warning-sign"></i> Emergency Access
                </button>
                <button id="syncPatientBtn" class="btn btn-info">
                    <i class="icon-refresh"></i> Sync Patient Data
                </button>
            </c:if>
            <button id="viewHistoryBtn" class="btn btn-default">
                <i class="icon-list"></i> View Access History
            </button>
        </div>
    </div>

    <div class="patientpassport-content">
        <c:choose>
            <c:when test="${hasPassport}">
                <div id="passportData" class="passport-data">
                    <c:if test="${not empty passport}">
                        <!-- Personal Information -->
                        <div class="passport-section">
                            <h3>Personal Information</h3>
                            <div class="passport-info">
                                <div class="info-row">
                                    <label>Full Name:</label>
                                    <span>${passport.personalInfo.fullName}</span>
                                </div>
                                <div class="info-row">
                                    <label>National ID:</label>
                                    <span>${passport.personalInfo.nationalId}</span>
                                </div>
                                <div class="info-row">
                                    <label>Date of Birth:</label>
                                    <span><openmrs:formatDate date="${passport.personalInfo.dateOfBirth}" /></span>
                                </div>
                                <div class="info-row">
                                    <label>Gender:</label>
                                    <span>${passport.personalInfo.gender}</span>
                                </div>
                                <div class="info-row">
                                    <label>Blood Type:</label>
                                    <span>${passport.personalInfo.bloodType}</span>
                                </div>
                                <div class="info-row">
                                    <label>Contact Number:</label>
                                    <span>${passport.personalInfo.contactNumber}</span>
                                </div>
                                <div class="info-row">
                                    <label>Email:</label>
                                    <span>${passport.personalInfo.email}</span>
                                </div>
                                <div class="info-row">
                                    <label>Address:</label>
                                    <span>${passport.personalInfo.address}</span>
                                </div>
                                <c:if test="${not empty passport.personalInfo.emergencyContact}">
                                    <div class="info-row">
                                        <label>Emergency Contact:</label>
                                        <span>${passport.personalInfo.emergencyContact.name} (${passport.personalInfo.emergencyContact.relationship}) - ${passport.personalInfo.emergencyContact.phone}</span>
                                    </div>
                                </c:if>
                            </div>
                        </div>

                        <!-- Medical Information -->
                        <c:if test="${not empty passport.medicalInfo}">
                            <div class="passport-section">
                                <h3>Medical Information</h3>
                                
                                <!-- Allergies -->
                                <c:if test="${not empty passport.medicalInfo.allergies}">
                                    <div class="medical-subsection">
                                        <h4>Allergies</h4>
                                        <ul>
                                            <c:forEach var="allergy" items="${passport.medicalInfo.allergies}">
                                                <li>${allergy}</li>
                                            </c:forEach>
                                        </ul>
                                    </div>
                                </c:if>

                                <!-- Current Medications -->
                                <c:if test="${not empty passport.medicalInfo.currentMedications}">
                                    <div class="medical-subsection">
                                        <h4>Current Medications</h4>
                                        <table class="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Medication</th>
                                                    <th>Dosage</th>
                                                    <th>Frequency</th>
                                                    <th>Prescribed By</th>
                                                    <th>Start Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <c:forEach var="medication" items="${passport.medicalInfo.currentMedications}">
                                                    <tr>
                                                        <td>${medication.name}</td>
                                                        <td>${medication.dosage}</td>
                                                        <td>${medication.frequency}</td>
                                                        <td>${medication.prescribedBy}</td>
                                                        <td><openmrs:formatDate date="${medication.startDate}" /></td>
                                                    </tr>
                                                </c:forEach>
                                            </tbody>
                                        </table>
                                    </div>
                                </c:if>

                                <!-- Medical Conditions -->
                                <c:if test="${not empty passport.medicalInfo.medicalConditions}">
                                    <div class="medical-subsection">
                                        <h4>Medical Conditions</h4>
                                        <table class="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Condition</th>
                                                    <th>Diagnosed Date</th>
                                                    <th>Diagnosed By</th>
                                                    <th>Status</th>
                                                    <th>Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <c:forEach var="condition" items="${passport.medicalInfo.medicalConditions}">
                                                    <tr>
                                                        <td>${condition.condition}</td>
                                                        <td><openmrs:formatDate date="${condition.diagnosedDate}" /></td>
                                                        <td>${condition.diagnosedBy}</td>
                                                        <td><span class="label label-${condition.status == 'active' ? 'danger' : condition.status == 'resolved' ? 'success' : 'warning'}">${condition.status}</span></td>
                                                        <td>${condition.notes}</td>
                                                    </tr>
                                                </c:forEach>
                                            </tbody>
                                        </table>
                                    </div>
                                </c:if>
                            </div>
                        </c:if>

                        <!-- Test Results -->
                        <c:if test="${not empty passport.testResults}">
                            <div class="passport-section">
                                <h3>Test Results</h3>
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Test Type</th>
                                            <th>Test Date</th>
                                            <th>Results</th>
                                            <th>Normal Range</th>
                                            <th>Status</th>
                                            <th>Lab Technician</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <c:forEach var="test" items="${passport.testResults}">
                                            <tr>
                                                <td>${test.testType}</td>
                                                <td><openmrs:formatDate date="${test.testDate}" /></td>
                                                <td>${test.results}</td>
                                                <td>${test.normalRange}</td>
                                                <td><span class="label label-${test.status == 'normal' ? 'success' : test.status == 'abnormal' ? 'warning' : 'danger'}">${test.status}</span></td>
                                                <td>${test.labTechnician}</td>
                                            </tr>
                                        </c:forEach>
                                    </tbody>
                                </table>
                            </div>
                        </c:if>

                        <!-- Hospital Visits -->
                        <c:if test="${not empty passport.hospitalVisits}">
                            <div class="passport-section">
                                <h3>Hospital Visits</h3>
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Visit Date</th>
                                            <th>Hospital</th>
                                            <th>Doctor</th>
                                            <th>Reason</th>
                                            <th>Diagnosis</th>
                                            <th>Treatment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <c:forEach var="visit" items="${passport.hospitalVisits}">
                                            <tr>
                                                <td><openmrs:formatDate date="${visit.visitDate}" /></td>
                                                <td>${visit.hospital}</td>
                                                <td>${visit.doctor}</td>
                                                <td>${visit.reason}</td>
                                                <td>${visit.diagnosis}</td>
                                                <td>${visit.treatment}</td>
                                            </tr>
                                        </c:forEach>
                                    </tbody>
                                </table>
                            </div>
                        </c:if>

                        <!-- Insurance Information -->
                        <c:if test="${not empty passport.insurance}">
                            <div class="passport-section">
                                <h3>Insurance Information</h3>
                                <div class="passport-info">
                                    <div class="info-row">
                                        <label>Provider:</label>
                                        <span>${passport.insurance.provider}</span>
                                    </div>
                                    <div class="info-row">
                                        <label>Policy Number:</label>
                                        <span>${passport.insurance.policyNumber}</span>
                                    </div>
                                    <div class="info-row">
                                        <label>Group Number:</label>
                                        <span>${passport.insurance.groupNumber}</span>
                                    </div>
                                    <div class="info-row">
                                        <label>Effective Date:</label>
                                        <span><openmrs:formatDate date="${passport.insurance.effectiveDate}" /></span>
                                    </div>
                                    <div class="info-row">
                                        <label>Expiry Date:</label>
                                        <span><openmrs:formatDate date="${passport.insurance.expiryDate}" /></span>
                                    </div>
                                    <div class="info-row">
                                        <label>Coverage Type:</label>
                                        <span>${passport.insurance.coverageType}</span>
                                    </div>
                                </div>
                            </div>
                        </c:if>

                        <!-- Passport Metadata -->
                        <div class="passport-section">
                            <h3>Passport Information</h3>
                            <div class="passport-info">
                                <div class="info-row">
                                    <label>Passport ID:</label>
                                    <span>${passport.passportId}</span>
                                </div>
                                <div class="info-row">
                                    <label>Version:</label>
                                    <span>${passport.version}</span>
                                </div>
                                <div class="info-row">
                                    <label>Last Updated:</label>
                                    <span><openmrs:formatDate date="${passport.lastUpdated}" /></span>
                                </div>
                                <div class="info-row">
                                    <label>Last Updated By:</label>
                                    <span>${passport.lastUpdatedBy}</span>
                                </div>
                            </div>
                        </div>
                    </c:if>
                </div>
            </c:when>
            <c:otherwise>
                <div class="no-passport">
                    <div class="alert alert-info">
                        <h4>No Patient Passport Found</h4>
                        <p>This patient does not have a passport in the external system.</p>
                        <button id="createPassportBtn" class="btn btn-primary">
                            <i class="icon-plus"></i> Create Patient Passport
                        </button>
                    </div>
                </div>
            </c:otherwise>
        </c:choose>
    </div>
</div>

<!-- OTP Modal -->
<div id="otpModal" class="modal fade" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">OTP Verification</h4>
            </div>
            <div class="modal-body">
                <div id="otpRequestForm">
                    <div class="form-group">
                        <label for="accessType">Access Type:</label>
                        <select id="accessType" class="form-control">
                            <option value="view">View Only</option>
                            <option value="update">Update</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="accessReason">Reason for Access:</label>
                        <textarea id="accessReason" class="form-control" rows="3" placeholder="Please provide a reason for accessing this patient's passport..."></textarea>
                    </div>
                    <button id="sendOtpBtn" class="btn btn-primary">Send OTP</button>
                </div>
                <div id="otpVerificationForm" style="display: none;">
                    <div class="form-group">
                        <label for="otpCode">Enter OTP Code:</label>
                        <input type="text" id="otpCode" class="form-control" placeholder="Enter 6-digit OTP code" maxlength="6">
                    </div>
                    <button id="verifyOtpBtn" class="btn btn-success">Verify OTP</button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Emergency Access Modal -->
<div id="emergencyModal" class="modal fade" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Emergency Access</h4>
            </div>
            <div class="modal-body">
                <div class="alert alert-warning">
                    <strong>Warning:</strong> Emergency access will be logged and monitored. Use only in genuine emergency situations.
                </div>
                <div class="form-group">
                    <label for="emergencyJustification">Justification for Emergency Access:</label>
                    <textarea id="emergencyJustification" class="form-control" rows="4" placeholder="Please provide detailed justification for emergency access..."></textarea>
                </div>
                <button id="confirmEmergencyBtn" class="btn btn-danger">Confirm Emergency Access</button>
            </div>
        </div>
    </div>
</div>

<!-- Access History Modal -->
<div id="historyModal" class="modal fade" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Access History</h4>
            </div>
            <div class="modal-body">
                <div id="historyContent">
                    <div class="text-center">
                        <i class="icon-spinner icon-spin"></i> Loading access history...
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script type="text/javascript">
    jQuery(document).ready(function($) {
        var patientId = ${patientId};
        
        // Request OTP
        $('#requestOtpBtn').click(function() {
            $('#otpModal').modal('show');
        });
        
        // Send OTP
        $('#sendOtpBtn').click(function() {
            var accessType = $('#accessType').val();
            var reason = $('#accessReason').val();
            
            if (!reason.trim()) {
                alert('Please provide a reason for access');
                return;
            }
            
            $.post('requestOtp.form', {
                patientId: patientId,
                accessType: accessType,
                reason: reason
            }, function(response) {
                if (response.success) {
                    $('#otpRequestForm').hide();
                    $('#otpVerificationForm').show();
                    alert('OTP sent successfully. Please check your registered contact method.');
                } else {
                    alert('Error: ' + response.message);
                }
            });
        });
        
        // Verify OTP
        $('#verifyOtpBtn').click(function() {
            var otp = $('#otpCode').val();
            
            if (!otp.trim()) {
                alert('Please enter the OTP code');
                return;
            }
            
            $.post('verifyOtp.form', {
                patientId: patientId,
                otp: otp
            }, function(response) {
                if (response.success) {
                    $('#otpModal').modal('hide');
                    location.reload(); // Reload page to show passport data
                } else {
                    alert('Error: ' + response.message);
                }
            });
        });
        
        // Emergency Access
        $('#emergencyAccessBtn').click(function() {
            $('#emergencyModal').modal('show');
        });
        
        $('#confirmEmergencyBtn').click(function() {
            var justification = $('#emergencyJustification').val();
            
            if (!justification.trim()) {
                alert('Please provide justification for emergency access');
                return;
            }
            
            $.post('emergencyAccess.form', {
                patientId: patientId,
                justification: justification
            }, function(response) {
                if (response.success) {
                    $('#emergencyModal').modal('hide');
                    location.reload(); // Reload page to show passport data
                } else {
                    alert('Error: ' + response.message);
                }
            });
        });
        
        // Sync Patient Data
        $('#syncPatientBtn').click(function() {
            if (confirm('Are you sure you want to sync patient data with the external passport system?')) {
                $.post('syncPatient.form', {
                    patientId: patientId
                }, function(response) {
                    if (response.success) {
                        alert('Patient data synced successfully');
                    } else {
                        alert('Error: ' + response.message);
                    }
                });
            }
        });
        
        // View Access History
        $('#viewHistoryBtn').click(function() {
            $('#historyModal').modal('show');
            
            $.get('accessHistory.form', {
                patientId: patientId,
                limit: 20
            }, function(response) {
                if (response.success) {
                    var historyHtml = '<table class="table table-striped">';
                    historyHtml += '<thead><tr><th>User</th><th>Access Type</th><th>Reason</th><th>OTP Verified</th><th>Emergency</th><th>Date</th></tr></thead>';
                    historyHtml += '<tbody>';
                    
                    if (response.data && response.data.length > 0) {
                        $.each(response.data, function(index, log) {
                            historyHtml += '<tr>';
                            historyHtml += '<td>' + (log.user ? log.user.display : 'Unknown') + '</td>';
                            historyHtml += '<td>' + log.accessType + '</td>';
                            historyHtml += '<td>' + log.accessReason + '</td>';
                            historyHtml += '<td>' + (log.otpVerified ? 'Yes' : 'No') + '</td>';
                            historyHtml += '<td>' + (log.emergencyOverride ? 'Yes' : 'No') + '</td>';
                            historyHtml += '<td>' + new Date(log.accessTimestamp).toLocaleString() + '</td>';
                            historyHtml += '</tr>';
                        });
                    } else {
                        historyHtml += '<tr><td colspan="6" class="text-center">No access history found</td></tr>';
                    }
                    
                    historyHtml += '</tbody></table>';
                    $('#historyContent').html(historyHtml);
                } else {
                    $('#historyContent').html('<div class="alert alert-danger">Error loading access history: ' + response.message + '</div>');
                }
            });
        });
        
        // Create Passport
        $('#createPassportBtn').click(function() {
            if (confirm('This will create a new patient passport in the external system. Continue?')) {
                // Redirect to external system or show creation form
                window.open('${frontendUrl}?action=create&patientId=' + patientId, '_blank');
            }
        });
    });
</script>

<style>
.patientpassport-container {
    margin: 20px;
}

.patientpassport-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e0e0e0;
}

.patientpassport-actions {
    display: flex;
    gap: 10px;
}

.passport-section {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background-color: #f9f9f9;
}

.passport-section h3 {
    margin-top: 0;
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
}

.passport-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 15px;
}

.info-row {
    display: flex;
    align-items: center;
}

.info-row label {
    font-weight: bold;
    margin-right: 10px;
    min-width: 120px;
}

.medical-subsection {
    margin-bottom: 20px;
}

.medical-subsection h4 {
    color: #34495e;
    margin-bottom: 15px;
}

.no-passport {
    text-align: center;
    padding: 40px;
}

.table th {
    background-color: #ecf0f1;
    font-weight: bold;
}

.label {
    font-size: 0.9em;
}

.modal-body .form-group {
    margin-bottom: 15px;
}

.modal-body .form-group label {
    font-weight: bold;
}

#otpVerificationForm {
    margin-top: 20px;
}

#otpCode {
    font-size: 18px;
    text-align: center;
    letter-spacing: 2px;
}
</style>

<%@ include file="/WEB-INF/template/footer.jsp" %>
