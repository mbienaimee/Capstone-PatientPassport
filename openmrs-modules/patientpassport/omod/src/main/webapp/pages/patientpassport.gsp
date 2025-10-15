<%@ page import="org.openmrs.api.context.Context" %>
<%@ page import="org.openmrs.api.AdministrationService" %>

<%
    def adminService = Context.getAdministrationService()
    def frontendUrl = adminService.getGlobalProperty("patientpassport.frontend.url", "https://jade-pothos-e432d0.netlify.app")
    def iframeHeight = adminService.getGlobalProperty("patientpassport.iframe_height", "90vh")
%>

<!DOCTYPE html>
<html>
<head>
    <title>Patient Passport - OpenMRS</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Open Sans', Arial, sans-serif;
            background-color: #f5f5f5;
        }
        
        .patientpassport-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .page-header {
            background: #2c3e50;
            color: white;
            padding: 15px 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .page-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 300;
        }
        
        .page-header .subtitle {
            margin: 5px 0 0 0;
            font-size: 14px;
            opacity: 0.8;
        }
        
        .page-content {
            flex: 1;
            padding: 20px;
            overflow: hidden;
        }
        
        .iframe-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
            height: calc(100vh - 140px);
        }
        
        .iframe-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255,255,255,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error-message {
            background: #e74c3c;
            color: white;
            padding: 15px;
            border-radius: 4px;
            margin: 20px;
            text-align: center;
        }
        
        .controls {
            background: white;
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .btn-primary {
            background: #3498db;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2980b9;
        }
        
        .btn-secondary {
            background: #95a5a6;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #7f8c8d;
        }
    </style>
</head>
<body>
    <div class="patientpassport-page">
        <div class="page-header">
            <h1>
                <i class="icon-user"></i>
                Patient Passport
            </h1>
            <p class="subtitle">Comprehensive Medical Records Management System</p>
        </div>
        
        <div class="page-content">
            <div class="controls">
                <div>
                    <button class="btn btn-primary" onclick="refreshIframe()">
                        <i class="icon-refresh"></i> Refresh
                    </button>
                    <button class="btn btn-secondary" onclick="openInNewWindow()">
                        <i class="icon-external-link"></i> Open in New Window
                    </button>
                </div>
                <div>
                    <small style="color: #666;">
                        Connected to: <strong>${frontendUrl}</strong>
                    </small>
                </div>
            </div>
            
            <div class="iframe-container" id="iframe-container">
                <div class="loading-overlay" id="loading-overlay">
                    <div class="loading-spinner"></div>
                </div>
                <iframe 
                    id="patientpassport-iframe"
                    src="${frontendUrl}" 
                    frameborder="0"
                    allowfullscreen
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-modals">
                </iframe>
            </div>
        </div>
    </div>

    <script>
        const iframe = document.getElementById('patientpassport-iframe');
        const loadingOverlay = document.getElementById('loading-overlay');
        const iframeContainer = document.getElementById('iframe-container');
        
        // Show loading overlay initially
        loadingOverlay.style.display = 'flex';
        
        // Hide loading overlay when iframe loads
        iframe.addEventListener('load', function() {
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 1000);
        });
        
        // Handle iframe load errors
        iframe.addEventListener('error', function() {
            loadingOverlay.innerHTML = '<div class="error-message">Failed to load Patient Passport. Please check your connection and try again.</div>';
        });
        
        function refreshIframe() {
            loadingOverlay.style.display = 'flex';
            loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
            iframe.src = iframe.src;
        }
        
        function openInNewWindow() {
            window.open(iframe.src, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        }
        
        // Handle window resize
        window.addEventListener('resize', function() {
            // Adjust iframe height if needed
            const containerHeight = window.innerHeight - 200;
            iframe.style.height = containerHeight + 'px';
        });
        
        // Post message handling for communication with iframe
        window.addEventListener('message', function(event) {
            // Handle messages from the Patient Passport iframe
            if (event.origin !== '${frontendUrl}') {
                return;
            }
            
            console.log('Message from Patient Passport:', event.data);
            
            // Handle specific message types
            if (event.data.type === 'resize') {
                // Handle iframe resize requests
                if (event.data.height) {
                    iframe.style.height = event.data.height + 'px';
                }
            }
        });
    </script>
</body>
</html>

