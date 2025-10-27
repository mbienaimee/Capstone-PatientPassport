<%@ include file="/WEB-INF/template/include.jsp" %>
<%@ include file="/WEB-INF/template/header.jsp" %>

<openmrs:require privilege="Patient Passport: View Patient Passport" otherwise="/login.htm" redirect="/module/patientpassport/iframe.htm" />

<style>
    .patientpassport-fullscreen-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #f8f9fa;
        z-index: 9999;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    
    .patientpassport-header-bar {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 15px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .patientpassport-header-bar h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .patientpassport-header-bar .header-icon {
        font-size: 28px;
    }
    
    .patientpassport-actions {
        display: flex;
        gap: 10px;
        align-items: center;
    }
    
    .patientpassport-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    
    .patientpassport-btn-primary {
        background: white;
        color: #10b981;
    }
    
    .patientpassport-btn-primary:hover {
        background: #f0fdf4;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .patientpassport-btn-danger {
        background: #ef4444;
        color: white;
    }
    
    .patientpassport-btn-danger:hover {
        background: #dc2626;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .patientpassport-iframe-container {
        flex: 1;
        position: relative;
        background: white;
        border-top: 2px solid #e5e7eb;
        overflow: hidden;
    }
    
    .patientpassport-iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
    }
    
    .patientpassport-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        z-index: 10;
    }
    
    .patientpassport-spinner {
        border: 4px solid #f3f4f6;
        border-top: 4px solid #10b981;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .patientpassport-status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: rgba(255,255,255,0.2);
        border-radius: 20px;
        font-size: 13px;
    }
    
    .patientpassport-status-dot {
        width: 8px;
        height: 8px;
        background: #4ade80;
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    .patientpassport-user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 16px;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        font-size: 14px;
    }
    
    .patientpassport-error {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        text-align: center;
        max-width: 500px;
    }
    
    .patientpassport-error-icon {
        font-size: 64px;
        color: #ef4444;
        margin-bottom: 20px;
    }
    
    .patientpassport-error h3 {
        color: #1f2937;
        margin-bottom: 10px;
    }
    
    .patientpassport-error p {
        color: #6b7280;
        margin-bottom: 20px;
    }
</style>

<div class="patientpassport-fullscreen-container">
    <div class="patientpassport-header-bar">
        <h2>
            <span class="header-icon">🏥</span>
            Patient Passport System
        </h2>
        
        <div class="patientpassport-actions">
            <div class="patientpassport-user-info">
                <i class="icon-user"></i>
                <span>${authenticatedUser.personName.fullName}</span>
            </div>
            
            <div class="patientpassport-status">
                <span class="patientpassport-status-dot"></span>
                Connected
            </div>
            
            <button class="patientpassport-btn patientpassport-btn-primary" onclick="refreshIframe()">
                <i class="icon-refresh"></i>
                Refresh
            </button>
            
            <button class="patientpassport-btn patientpassport-btn-primary" onclick="openInNewTab()">
                <i class="icon-external-link"></i>
                Open in New Tab
            </button>
            
            <button class="patientpassport-btn patientpassport-btn-danger" onclick="closeFullscreen()">
                <i class="icon-remove"></i>
                Exit
            </button>
        </div>
    </div>
    
    <div class="patientpassport-iframe-container">
        <div id="loadingIndicator" class="patientpassport-loading">
            <div class="patientpassport-spinner"></div>
            <h3>Loading Patient Passport System...</h3>
            <p>Connecting to <strong>https://patient-passpo.netlify.app</strong></p>
        </div>
        
        <iframe 
            id="patientPassportIframe" 
            class="patientpassport-iframe" 
            src="https://patient-passpo.netlify.app/?openmrs=true&user=${authenticatedUser.username}&source=openmrs"
            onload="handleIframeLoad()"
            onerror="handleIframeError()"
            allow="camera; microphone; geolocation"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
        ></iframe>
    </div>
</div>

<script type="text/javascript">
    // Hide loading indicator when iframe loads
    function handleIframeLoad() {
        setTimeout(function() {
            document.getElementById('loadingIndicator').style.display = 'none';
        }, 1000);
        
        console.log('Patient Passport System loaded successfully');
        
        // Post message to iframe with OpenMRS context
        sendContextToIframe();
    }
    
    // Handle iframe load errors
    function handleIframeError() {
        var loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.innerHTML = '<div class="patientpassport-error">' +
            '<div class="patientpassport-error-icon">⚠️</div>' +
            '<h3>Connection Error</h3>' +
            '<p>Unable to load the Patient Passport System. Please check your internet connection and try again.</p>' +
            '<button class="patientpassport-btn patientpassport-btn-primary" onclick="refreshIframe()">Try Again</button>' +
            '</div>';
    }
    
    // Send OpenMRS context to iframe
    function sendContextToIframe() {
        var iframe = document.getElementById('patientPassportIframe');
        var context = {
            source: 'openmrs',
            user: {
                username: '${authenticatedUser.username}',
                name: '${authenticatedUser.personName.fullName}',
                userId: '${authenticatedUser.userId}'
            },
            timestamp: new Date().toISOString()
        };
        
        try {
            iframe.contentWindow.postMessage(context, 'https://patient-passpo.netlify.app');
        } catch (e) {
            console.error('Failed to send context to iframe:', e);
        }
    }
    
    // Refresh iframe
    function refreshIframe() {
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('patientPassportIframe').src = 
            'https://patient-passpo.netlify.app/?openmrs=true&user=${authenticatedUser.username}&source=openmrs&t=' + 
            new Date().getTime();
    }
    
    // Open in new tab
    function openInNewTab() {
        window.open('https://patient-passpo.netlify.app/?openmrs=true&user=${authenticatedUser.username}&source=openmrs', '_blank');
    }
    
    // Close fullscreen and return to OpenMRS
    function closeFullscreen() {
        window.location.href = '${pageContext.request.contextPath}/index.htm';
    }
    
    // Listen for messages from iframe
    window.addEventListener('message', function(event) {
        // Verify origin
        if (event.origin !== 'https://patient-passpo.netlify.app') {
            return;
        }
        
        console.log('Message from Patient Passport:', event.data);
        
        // Handle different message types
        if (event.data.type === 'ready') {
            console.log('Patient Passport is ready');
            sendContextToIframe();
        } else if (event.data.type === 'logout') {
            alert('Logged out from Patient Passport');
            closeFullscreen();
        } else if (event.data.type === 'error') {
            alert('Error: ' + event.data.message);
        }
    });
    
    // Prevent navigation away without confirmation
    window.addEventListener('beforeunload', function(e) {
        var confirmationMessage = 'Are you sure you want to leave Patient Passport?';
        e.returnValue = confirmationMessage;
        return confirmationMessage;
    });
</script>

<%@ include file="/WEB-INF/template/footer.jsp" %>
