<% ui.decorateWith("appui", "standardEmrPage") %>

<style>
    .passport-container {
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }
    
    .passport-header {
        background: #2c3e50;
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .passport-header h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 300;
    }
    
    .passport-iframe {
        flex: 1;
        border: none;
        width: 100%;
        height: ${iframeHeight};
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
        background: #3498db;
        color: white;
        transition: background-color 0.3s;
    }
    
    .btn:hover {
        background: #2980b9;
    }
    
    .error-message {
        padding: 20px;
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        margin: 20px;
        display: none;
    }
    
    .loading-message {
        padding: 20px;
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
        border-radius: 4px;
        margin: 20px;
        text-align: center;
    }
</style>

<div class="passport-container">
    <div class="passport-header">
        <h1>
            <i class="icon-user"></i>
            Patient Passport - OpenMRS Integration
        </h1>
        <a href="${frontendUrl}" target="_blank" class="btn">
            <i class="icon-external-link"></i> Open in New Tab
        </a>
    </div>
    
    <div class="loading-message" id="loading-message">
        Loading Patient Passport...
    </div>
    
    <iframe 
        id="passport-iframe"
        src="${passportUrl}" 
        class="passport-iframe"
        frameborder="0"
        allowfullscreen
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation">
    </iframe>
    
    <div class="error-message" id="error-message">
        <strong>Connection Error:</strong> Unable to load Patient Passport. Please check your internet connection or try opening in a new tab.
    </div>
</div>

<script>
    // Hide loading message after iframe loads
    document.getElementById('passport-iframe').onload = function() {
        document.getElementById('loading-message').style.display = 'none';
    };
    
    // Show error if iframe fails to load
    document.getElementById('passport-iframe').onerror = function() {
        document.getElementById('loading-message').style.display = 'none';
        document.getElementById('error-message').style.display = 'block';
    };
    
    // Add timeout check
    setTimeout(function() {
        const loadingMsg = document.getElementById('loading-message');
        if (loadingMsg.style.display !== 'none') {
            loadingMsg.style.display = 'none';
            document.getElementById('error-message').style.display = 'block';
        }
    }, 10000);
</script>