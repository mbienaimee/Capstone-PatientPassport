<%@ page import="org.openmrs.api.context.Context" %>
<%@ page import="org.openmrs.module.patientpassport.web.controller.PatientPassportPageController" %>
<%@ page import="org.openmrs.Patient" %>
<%@ page import="org.openmrs.api.PatientService" %>
<%@ page import="org.openmrs.api.AdministrationService" %>

<%
    def adminService = Context.getAdministrationService()
    def frontendUrl = adminService.getGlobalProperty("patientpassport.frontend.url", "https://jade-pothos-e432d0.netlify.app")
    def iframeHeight = adminService.getGlobalProperty("patientpassport.iframe_height", "90vh")
    def enablePatientContext = adminService.getGlobalProperty("patientpassport.enable_patient_context", "true").toBoolean()
    
    def patientId = request.getParameter("patientId")
    def passportUrl = frontendUrl
    
    if (enablePatientContext && patientId) {
        try {
            def patientService = Context.getPatientService()
            def patient = patientService.getPatientByUuid(patientId)
            if (patient) {
                passportUrl = "${frontendUrl}/patient/${patientId}"
            }
        } catch (Exception e) {
            // Log error but continue with default URL
            log.error("Error getting patient context: " + e.getMessage())
        }
    }
%>

<div class="patientpassport-container">
    <div class="patientpassport-header">
        <h3>
            <i class="icon-user"></i>
            Patient Passport
        </h3>
        <div class="patientpassport-actions">
            <button class="btn btn-sm btn-primary" onclick="refreshPassport()">
                <i class="icon-refresh"></i> Refresh
            </button>
            <button class="btn btn-sm btn-default" onclick="openInNewTab()">
                <i class="icon-external-link"></i> Open in New Tab
            </button>
        </div>
    </div>
    
    <div class="patientpassport-content">
        <iframe 
            id="patientpassport-iframe"
            src="${passportUrl}" 
            style="width: 100%; height: ${iframeHeight}; border: none; border-radius: 4px;"
            frameborder="0"
            allowfullscreen
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation">
        </iframe>
    </div>
    
    <div class="patientpassport-footer">
        <small class="text-muted">
            <i class="icon-info-sign"></i>
            This interface connects to the Patient Passport system for comprehensive medical record management.
        </small>
    </div>
</div>

<style>
.patientpassport-container {
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin: 10px 0;
}

.patientpassport-header {
    background: #f8f9fa;
    padding: 15px 20px;
    border-bottom: 1px solid #dee2e6;
    border-radius: 6px 6px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.patientpassport-header h3 {
    margin: 0;
    color: #495057;
    font-size: 18px;
}

.patientpassport-actions {
    display: flex;
    gap: 10px;
}

.patientpassport-content {
    padding: 0;
    position: relative;
}

.patientpassport-footer {
    background: #f8f9fa;
    padding: 10px 20px;
    border-top: 1px solid #dee2e6;
    border-radius: 0 0 6px 6px;
}

.patientpassport-footer small {
    color: #6c757d;
}

.btn {
    padding: 6px 12px;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    font-size: 12px;
    line-height: 1.5;
}

.btn-sm {
    padding: 4px 8px;
    font-size: 11px;
}

.btn-primary {
    color: #fff;
    background-color: #007bff;
    border-color: #007bff;
}

.btn-primary:hover {
    background-color: #0056b3;
    border-color: #004085;
}

.btn-default {
    color: #333;
    background-color: #fff;
    border-color: #ccc;
}

.btn-default:hover {
    background-color: #e6e6e6;
    border-color: #adadad;
}
</style>

<script>
function refreshPassport() {
    var iframe = document.getElementById('patientpassport-iframe');
    if (iframe) {
        iframe.src = iframe.src;
    }
}

function openInNewTab() {
    var iframe = document.getElementById('patientpassport-iframe');
    if (iframe) {
        window.open(iframe.src, '_blank');
    }
}

// Handle iframe load events
document.getElementById('patientpassport-iframe').addEventListener('load', function() {
    console.log('Patient Passport iframe loaded successfully');
});

// Handle iframe errors
document.getElementById('patientpassport-iframe').addEventListener('error', function() {
    console.error('Error loading Patient Passport iframe');
});
</script>


