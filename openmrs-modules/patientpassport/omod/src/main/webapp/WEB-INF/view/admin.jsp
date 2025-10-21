<%@ page import="org.openmrs.api.context.Context" %>
<%@ page import="org.openmrs.api.AdministrationService" %>

<%
    AdministrationService adminService = Context.getAdministrationService();
    String frontendUrl = adminService.getGlobalProperty("patientpassport.frontend.url", "https://jade-pothos-e432d0.netlify.app");
    String backendUrl = adminService.getGlobalProperty("patientpassport.backend.url", "https://capstone-patientpassport.onrender.com/api");
    String enablePatientContext = adminService.getGlobalProperty("patientpassport.enable_patient_context", "true");
    String iframeHeight = adminService.getGlobalProperty("patientpassport.iframe_height", "90vh");
%>

<!DOCTYPE html>
<html>
<head>
    <title>Patient Passport Settings - OpenMRS</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Open Sans', Arial, sans-serif;
            background-color: #f5f5f5;
        }
        
        .admin-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .admin-header {
            background: #2c3e50;
            color: white;
            padding: 20px;
        }
        
        .admin-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 300;
        }
        
        .admin-content {
            padding: 30px;
        }
        
        .settings-section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 6px;
            background: #f9f9f9;
        }
        
        .settings-section h3 {
            margin-top: 0;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #555;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
        }
        
        .form-group small {
            color: #666;
            font-size: 12px;
            margin-top: 5px;
            display: block;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
            margin-right: 10px;
        }
        
        .btn-primary {
            background: #3498db;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2980b9;
        }
        
        .btn-success {
            background: #27ae60;
            color: white;
        }
        
        .btn-success:hover {
            background: #229954;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-online {
            background: #27ae60;
        }
        
        .info-box {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            color: #0d47a1;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        
        .info-box h4 {
            margin-top: 0;
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <div class="admin-header">
            <h1>
                <i class="icon-cogs"></i>
                Patient Passport Settings
            </h1>
        </div>
        
        <div class="admin-content">
            <div class="info-box">
                <h4>Configuration Information</h4>
                <p>Configure the Patient Passport module settings below. Changes will take effect immediately after saving.</p>
            </div>
            
            <div class="settings-section">
                <h3>Frontend Configuration</h3>
                
                <div class="form-group">
                    <label for="frontend-url">Frontend URL</label>
                    <input type="url" id="frontend-url" name="frontend-url" value="<%= frontendUrl %>" readonly>
                    <small>The URL of your deployed Patient Passport frontend application</small>
                </div>
                
                <div class="form-group">
                    <label for="iframe-height">Iframe Height</label>
                    <input type="text" id="iframe-height" name="iframe-height" value="<%= iframeHeight %>" readonly>
                    <small>Height of the iframe containing the Patient Passport application</small>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Backend Configuration</h3>
                
                <div class="form-group">
                    <label for="backend-url">Backend API URL</label>
                    <input type="url" id="backend-url" name="backend-url" value="<%= backendUrl %>" readonly>
                    <small>The URL of your Patient Passport backend API</small>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Patient Context Settings</h3>
                
                <div class="form-group">
                    <label for="enable-patient-context">Enable Patient Context</label>
                    <input type="text" id="enable-patient-context" name="enable-patient-context" value="<%= enablePatientContext %>" readonly>
                    <small>When enabled, patient information will be passed to the Patient Passport application</small>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Connection Status</h3>
                <p>
                    <span class="status-indicator status-online"></span>
                    Frontend: <strong><%= frontendUrl %></strong>
                </p>
                <p>
                    <span class="status-indicator status-online"></span>
                    Backend: <strong><%= backendUrl %></strong>
                </p>
            </div>
            
            <div style="text-align: right; margin-top: 30px;">
                <a href="<%= frontendUrl %>" target="_blank" class="btn btn-primary">
                    <i class="icon-external-link"></i> Open Patient Passport
                </a>
                <a href="/openmrs/module/patientpassport/patientPassport.page" class="btn btn-success">
                    <i class="icon-home"></i> Go to Main Page
                </a>
            </div>
        </div>
    </div>
</body>
</html>
