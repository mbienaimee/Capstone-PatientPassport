<%@ page import="org.openmrs.api.context.Context" %>
<%@ page import="org.openmrs.api.AdministrationService" %>

<%
    def adminService = Context.getAdministrationService()
    def frontendUrl = adminService.getGlobalProperty("patientpassport.frontend.url", "https://jade-pothos-e432d0.netlify.app")
    def backendUrl = adminService.getGlobalProperty("patientpassport.backend.url", "https://capstone-patientpassport.onrender.com/api")
    def enablePatientContext = adminService.getGlobalProperty("patientpassport.enable_patient_context", "true")
    def iframeHeight = adminService.getGlobalProperty("patientpassport.iframe_height", "90vh")
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
        
        .btn-warning {
            background: #f39c12;
            color: white;
        }
        
        .btn-warning:hover {
            background: #e67e22;
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
        
        .status-offline {
            background: #e74c3c;
        }
        
        .test-results {
            margin-top: 20px;
            padding: 15px;
            border-radius: 4px;
            display: none;
        }
        
        .test-success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        
        .test-error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
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
            
            <form id="settings-form">
                <div class="settings-section">
                    <h3>Frontend Configuration</h3>
                    
                    <div class="form-group">
                        <label for="frontend-url">Frontend URL</label>
                        <input type="url" id="frontend-url" name="frontend-url" value="${frontendUrl}" required>
                        <small>The URL of your deployed Patient Passport frontend application</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="iframe-height">Iframe Height</label>
                        <select id="iframe-height" name="iframe-height">
                            <option value="80vh" ${iframeHeight == '80vh' ? 'selected' : ''}>80vh</option>
                            <option value="85vh" ${iframeHeight == '85vh' ? 'selected' : ''}>85vh</option>
                            <option value="90vh" ${iframeHeight == '90vh' ? 'selected' : ''}>90vh</option>
                            <option value="95vh" ${iframeHeight == '95vh' ? 'selected' : ''}>95vh</option>
                            <option value="100vh" ${iframeHeight == '100vh' ? 'selected' : ''}>100vh</option>
                        </select>
                        <small>Height of the iframe containing the Patient Passport application</small>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Backend Configuration</h3>
                    
                    <div class="form-group">
                        <label for="backend-url">Backend API URL</label>
                        <input type="url" id="backend-url" name="backend-url" value="${backendUrl}" required>
                        <small>The URL of your Patient Passport backend API</small>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Patient Context Settings</h3>
                    
                    <div class="form-group">
                        <label for="enable-patient-context">Enable Patient Context</label>
                        <select id="enable-patient-context" name="enable-patient-context">
                            <option value="true" ${enablePatientContext == 'true' ? 'selected' : ''}>Yes</option>
                            <option value="false" ${enablePatientContext == 'false' ? 'selected' : ''}>No</option>
                        </select>
                        <small>When enabled, patient information will be passed to the Patient Passport application</small>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Connection Status</h3>
                    <p>
                        <span class="status-indicator status-online"></span>
                        Frontend: <strong>${frontendUrl}</strong>
                    </p>
                    <p>
                        <span class="status-indicator status-online"></span>
                        Backend: <strong>${backendUrl}</strong>
                    </p>
                    
                    <button type="button" class="btn btn-warning" onclick="testConnections()">
                        <i class="icon-refresh"></i> Test Connections
                    </button>
                    
                    <div id="test-results" class="test-results"></div>
                </div>
                
                <div style="text-align: right; margin-top: 30px;">
                    <button type="button" class="btn btn-primary" onclick="saveSettings()">
                        <i class="icon-save"></i> Save Settings
                    </button>
                    <button type="button" class="btn btn-success" onclick="openPatientPassport()">
                        <i class="icon-external-link"></i> Open Patient Passport
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function saveSettings() {
            // In a real implementation, this would save to OpenMRS global properties
            alert('Settings saved successfully! (Note: This is a demo - settings are not actually saved)');
        }
        
        function testConnections() {
            const testResults = document.getElementById('test-results');
            testResults.style.display = 'block';
            testResults.className = 'test-results';
            testResults.innerHTML = '<p>Testing connections...</p>';
            
            // Test frontend connection
            const frontendUrl = document.getElementById('frontend-url').value;
            const backendUrl = document.getElementById('backend-url').value;
            
            Promise.all([
                testUrl(frontendUrl),
                testUrl(backendUrl)
            ]).then(results => {
                const [frontendResult, backendResult] = results;
                
                if (frontendResult && backendResult) {
                    testResults.className = 'test-results test-success';
                    testResults.innerHTML = '<p><strong>✓ All connections successful!</strong></p>';
                } else {
                    testResults.className = 'test-results test-error';
                    testResults.innerHTML = '<p><strong>✗ Connection test failed</strong></p>';
                }
            }).catch(error => {
                testResults.className = 'test-results test-error';
                testResults.innerHTML = '<p><strong>✗ Connection test failed:</strong> ' + error.message + '</p>';
            });
        }
        
        function testUrl(url) {
            return fetch(url, { method: 'HEAD', mode: 'no-cors' })
                .then(() => true)
                .catch(() => false);
        }
        
        function openPatientPassport() {
            const frontendUrl = document.getElementById('frontend-url').value;
            window.open(frontendUrl, '_blank');
        }
        
        // Auto-save functionality (demo)
        document.addEventListener('DOMContentLoaded', function() {
            const inputs = document.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('change', function() {
                    console.log('Setting changed:', this.name, this.value);
                });
            });
        });
    </script>
</body>
</html>


