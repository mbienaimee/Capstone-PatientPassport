<%@ page import="org.openmrs.api.context.Context" %>
<%@ page import="org.openmrs.Patient" %>
<%@ page import="org.openmrs.api.PatientService" %>
<%@ page import="org.openmrs.api.AdministrationService" %>

<%
    def adminService = Context.getAdministrationService()
    def frontendUrl = adminService.getGlobalProperty("patientpassport.frontend.url", "https://jade-pothos-e432d0.netlify.app")
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
            log.error("Error getting patient context for fragment: " + e.getMessage())
        }
    }
%>

<div class="patientpassport-fragment">
    <div class="fragment-header">
        <h4>
            <i class="icon-user"></i>
            Patient Passport
        </h4>
        <button class="btn btn-xs btn-primary" onclick="openPatientPassport()">
            <i class="icon-external-link"></i> Open
        </button>
    </div>
    
    <div class="fragment-content">
        <iframe 
            id="patientpassport-fragment-iframe"
            src="${passportUrl}" 
            style="width: 100%; height: 400px; border: none; border-radius: 4px;"
            frameborder="0"
            allowfullscreen
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation">
        </iframe>
    </div>
    
    <div class="fragment-footer">
        <small class="text-muted">
            <i class="icon-info-sign"></i>
            Access comprehensive medical records and passport management
        </small>
    </div>
</div>

<style>
.patientpassport-fragment {
    background: #fff;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    margin: 10px 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.fragment-header {
    background: #f8f9fa;
    padding: 10px 15px;
    border-bottom: 1px solid #dee2e6;
    border-radius: 6px 6px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.fragment-header h4 {
    margin: 0;
    color: #495057;
    font-size: 14px;
}

.fragment-content {
    padding: 0;
}

.fragment-footer {
    background: #f8f9fa;
    padding: 8px 15px;
    border-top: 1px solid #dee2e6;
    border-radius: 0 0 6px 6px;
}

.fragment-footer small {
    color: #6c757d;
    font-size: 11px;
}

.btn-xs {
    padding: 2px 6px;
    font-size: 10px;
    line-height: 1.2;
}
</style>

<script>
function openPatientPassport() {
    var iframe = document.getElementById('patientpassport-fragment-iframe');
    if (iframe) {
        window.open(iframe.src, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
}
</script>


