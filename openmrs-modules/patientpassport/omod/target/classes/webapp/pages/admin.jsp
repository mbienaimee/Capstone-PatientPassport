<%@ page import="org.openmrs.api.context.Context" %>
<%@ page import="org.openmrs.api.AdministrationService" %>
<%@ page contentType="text/html;charset=UTF-8" %>

<%
    AdministrationService adminService = Context.getAdministrationService();
    
    // Get configuration from global properties
    String frontendUrl = adminService.getGlobalProperty("patientpassport.frontend.url", 
        "https://jade-pothos-e432d0.netlify.app");
    String backendUrl = adminService.getGlobalProperty("patientpassport.backend.url", 
        "https://capstone-patientpassport.onrender.com/api");
    String enablePatientContext = adminService.getGlobalProperty("patientpassport.enable_patient_context", "true");
    String iframeHeight = adminService.getGlobalProperty("patientpassport.iframe_height", "90vh");
%>

<!DOCTYPE html>
<html>
<head>
    <title>Patient Passport Settings</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 15px; margin-bottom: 30px; }
        .config-section { margin: 25px 0; padding: 20px; border: 1px solid #ddd; border-radius: 6px; background: #f9f9f9; }
        .config-item { margin: 15px 0; }
        .config-item label { display: block; font-weight: bold; margin-bottom: 8px; color: #555; }
        .config-item input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
        .btn { padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; text-decoration: none; display: inline-block; margin: 10px 10px 0 0; background: #3498db; color: white; }
        .btn:hover { background: #2980b9; }
        .success-message { background: #d4edda; color: #155724; padding: 10px; margin: 10px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Patient Passport Admin Settings</h1>
        
        <div class="success-message">
            ✅ Patient Passport Admin Settings Loaded Successfully!
        </div>
        
        <div class="config-section">
            <h3>Configuration</h3>
            <div class="config-item">
                <label>Frontend URL</label>
                <input type="text" value="<%= frontendUrl %>" readonly>
            </div>
            <div class="config-item">
                <label>Backend URL</label>
                <input type="text" value="<%= backendUrl %>" readonly>
            </div>
            <div class="config-item">
                <label>Iframe Height</label>
                <input type="text" value="<%= iframeHeight %>" readonly>
            </div>
            <div class="config-item">
                <label>Enable Patient Context</label>
                <input type="text" value="<%= enablePatientContext %>" readonly>
            </div>
        </div>
        <div class="config-section">
            <h3>Quick Access</h3>
            <a href="/openmrs/module/patientpassport/pages/patientPassport.jsp" class="btn">Open Patient Passport</a>
            <a href="<%= frontendUrl %>" target="_blank" class="btn">Frontend (New Tab)</a>
            <a href="<%= backendUrl %>" target="_blank" class="btn">Backend API</a>
        </div>
    </div>
</body>
</html>