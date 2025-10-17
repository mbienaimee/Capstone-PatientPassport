<%@ page import="org.openmrs.api.context.Context" %>
<%@ page import="org.openmrs.api.AdministrationService" %>

<%
    AdministrationService adminService = Context.getAdministrationService();
    String frontendUrl = adminService.getGlobalProperty("patientpassport.frontend.url", "https://jade-pothos-e432d0.netlify.app");
    String iframeHeight = adminService.getGlobalProperty("patientpassport.iframe_height", "90vh");
    Boolean enablePatientContext = Boolean.parseBoolean(
        adminService.getGlobalProperty("patientpassport.enable_patient_context", "true"));
    
    String patientId = request.getParameter("patientId");
    String passportUrl = frontendUrl;
    
    if (enablePatientContext && patientId != null) {
        try {
            org.openmrs.api.PatientService patientService = Context.getPatientService();
            org.openmrs.Patient patient = patientService.getPatientByUuid(patientId);
            if (patient != null) {
                passportUrl = frontendUrl + "/patient/" + patientId;
            }
        } catch (Exception e) {
            // Log error but continue with default URL
            System.err.println("Error getting patient context: " + e.getMessage());
        }
    }
%>

<!DOCTYPE html>
<html>
<head>
    <title>Patient Passport</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Open Sans', Arial, sans-serif;
            background-color: #f5f5f5;
        }
        
        .passport-container {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .passport-header {
            background: #2c3e50;
            color: white;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .passport-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 300;
        }
        
        .passport-iframe {
            flex: 1;
            border: none;
            width: 100%;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            text-decoration: none;
            display: inline-block;
            margin-left: 10px;
        }
        
        .btn-primary {
            background: #3498db;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="passport-container">
        <div class="passport-header">
            <h2>
                <i class="icon-user"></i>
                Patient Passport
            </h2>
            <a href="<%= passportUrl %>" target="_blank" class="btn btn-primary">
                <i class="icon-external-link"></i> Open in New Tab
            </a>
        </div>
        
        <iframe 
            src="<%= passportUrl %>" 
            class="passport-iframe"
            style="height: <%= iframeHeight %>;"
            frameborder="0"
            allowfullscreen
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation">
        </iframe>
    </div>
</body>
</html>
