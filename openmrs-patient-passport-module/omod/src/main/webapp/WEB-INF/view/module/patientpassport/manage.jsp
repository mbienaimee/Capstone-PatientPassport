<%@ page contentType="text/html;charset=UTF-8" %>
<%@ include file="/WEB-INF/template/include.jsp" %>
<%@ include file="/WEB-INF/template/header.jsp" %>

<openmrs:require privilege="Patient Passport: View Patient Passport" otherwise="/login.htm" redirect="/module/patientpassport/manage.htm" />

<div class="patientpassport-manage-container">
    <div class="manage-header">
        <h2>
            <spring:message code="patientpassport.title" /> - Management
        </h2>
        <p class="manage-description">
            <spring:message code="patientpassport.description" />
        </p>
    </div>

    <div class="manage-content">
        <!-- Configuration Section -->
        <div class="config-section">
            <h3>Configuration</h3>
            <div class="config-grid">
                <div class="config-item">
                    <label>API Base URL:</label>
                    <div class="config-control">
                        <input type="text" id="apiBaseUrl" class="form-control" value="${apiBaseUrl}" />
                        <button class="btn btn-sm btn-primary" onclick="updateConfig('patientpassport.api.baseUrl', $('#apiBaseUrl').val())">Update</button>
                    </div>
                </div>
                
                <div class="config-item">
                    <label>Frontend URL:</label>
                    <div class="config-control">
                        <input type="text" id="frontendUrl" class="form-control" value="${frontendUrl}" />
                        <button class="btn btn-sm btn-primary" onclick="updateConfig('patientpassport.frontend.url', $('#frontendUrl').val())">Update</button>
                    </div>
                </div>
                
                <div class="config-item">
                    <label>API Timeout (ms):</label>
                    <div class="config-control">
                        <input type="number" id="apiTimeout" class="form-control" value="30000" />
                        <button class="btn btn-sm btn-primary" onclick="updateConfig('patientpassport.api.timeout', $('#apiTimeout').val())">Update</button>
                    </div>
                </div>
                
                <div class="config-item">
                    <label>Enable OTP:</label>
                    <div class="config-control">
                        <select id="enableOtp" class="form-control">
                            <option value="true" ${otpEnabled ? 'selected' : ''}>Yes</option>
                            <option value="false" ${!otpEnabled ? 'selected' : ''}>No</option>
                        </select>
                        <button class="btn btn-sm btn-primary" onclick="updateConfig('patientpassport.enable.otp', $('#enableOtp').val())">Update</button>
                    </div>
                </div>
                
                <div class="config-item">
                    <label>Audit Logging:</label>
                    <div class="config-control">
                        <select id="auditLogging" class="form-control">
                            <option value="true" ${auditLogging ? 'selected' : ''}>Yes</option>
                            <option value="false" ${!auditLogging ? 'selected' : ''}>No</option>
                        </select>
                        <button class="btn btn-sm btn-primary" onclick="updateConfig('patientpassport.audit.logging', $('#auditLogging').val())">Update</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions Section -->
        <div class="actions-section">
            <h3>Quick Actions</h3>
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="openExternalSystem()">
                    <i class="icon-external-link"></i> Open External System
                </button>
                <button class="btn btn-info" onclick="testConnection()">
                    <i class="icon-check"></i> Test API Connection
                </button>
                <button class="btn btn-warning" onclick="viewSystemLogs()">
                    <i class="icon-list"></i> View System Logs
                </button>
                <button class="btn btn-success" onclick="exportConfiguration()">
                    <i class="icon-download"></i> Export Configuration
                </button>
            </div>
        </div>

        <!-- Statistics Section -->
        <div class="stats-section">
            <h3>System Statistics</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-number" id="totalPatients">-</div>
                    <div class="stat-label">Patients with Passports</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="totalAccesses">-</div>
                    <div class="stat-label">Total Accesses Today</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="emergencyAccesses">-</div>
                    <div class="stat-label">Emergency Accesses</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="lastSync">-</div>
                    <div class="stat-label">Last Sync</div>
                </div>
            </div>
        </div>

        <!-- Patient Search Section -->
        <div class="search-section">
            <h3>Patient Search</h3>
            <div class="search-controls">
                <div class="form-group">
                    <label for="patientSearch">Search by Patient ID or Name:</label>
                    <div class="input-group">
                        <input type="text" id="patientSearch" class="form-control" placeholder="Enter patient ID or name..." />
                        <span class="input-group-btn">
                            <button class="btn btn-primary" onclick="searchPatients()">
                                <i class="icon-search"></i> Search
                            </button>
                        </span>
                    </div>
                </div>
            </div>
            <div id="searchResults" class="search-results" style="display: none;">
                <!-- Search results will be populated here -->
            </div>
        </div>

        <!-- Recent Activity Section -->
        <div class="activity-section">
            <h3>Recent Activity</h3>
            <div id="recentActivity" class="activity-list">
                <div class="text-center">
                    <i class="icon-spinner icon-spin"></i> Loading recent activity...
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Test Connection Modal -->
<div id="testModal" class="modal fade" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Test API Connection</h4>
            </div>
            <div class="modal-body">
                <div id="testResults">
                    <div class="text-center">
                        <i class="icon-spinner icon-spin"></i> Testing connection...
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- System Logs Modal -->
<div id="logsModal" class="modal fade" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">System Logs</h4>
            </div>
            <div class="modal-body">
                <div id="logsContent">
                    <div class="text-center">
                        <i class="icon-spinner icon-spin"></i> Loading logs...
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script type="text/javascript">
    jQuery(document).ready(function($) {
        // Load statistics
        loadStatistics();
        
        // Load recent activity
        loadRecentActivity();
        
        // Search functionality
        $('#patientSearch').keypress(function(e) {
            if (e.which == 13) { // Enter key
                searchPatients();
            }
        });
    });
    
    function updateConfig(key, value) {
        $.post('updateConfig.form', {
            key: key,
            value: value
        }, function(response) {
            if (response.success) {
                showMessage('Configuration updated successfully', 'success');
            } else {
                showMessage('Error updating configuration: ' + response.message, 'error');
            }
        });
    }
    
    function openExternalSystem() {
        var frontendUrl = $('#frontendUrl').val();
        if (frontendUrl) {
            window.open(frontendUrl, '_blank');
        } else {
            showMessage('Please configure the frontend URL first', 'warning');
        }
    }
    
    function testConnection() {
        $('#testModal').modal('show');
        
        $.get('testConnection.form', function(response) {
            var html = '';
            if (response.success) {
                html = '<div class="alert alert-success">';
                html += '<h4><i class="icon-ok"></i> Connection Successful</h4>';
                html += '<p>API is responding correctly.</p>';
                html += '<p><strong>Response Time:</strong> ' + response.responseTime + 'ms</p>';
                html += '<p><strong>API Version:</strong> ' + response.version + '</p>';
                html += '</div>';
            } else {
                html = '<div class="alert alert-danger">';
                html += '<h4><i class="icon-remove"></i> Connection Failed</h4>';
                html += '<p>Error: ' + response.message + '</p>';
                html += '</div>';
            }
            $('#testResults').html(html);
        });
    }
    
    function viewSystemLogs() {
        $('#logsModal').modal('show');
        
        $.get('getLogs.form', function(response) {
            var html = '';
            if (response.success && response.logs) {
                html = '<table class="table table-striped">';
                html += '<thead><tr><th>Timestamp</th><th>Level</th><th>Message</th></tr></thead>';
                html += '<tbody>';
                
                $.each(response.logs, function(index, log) {
                    html += '<tr>';
                    html += '<td>' + new Date(log.timestamp).toLocaleString() + '</td>';
                    html += '<td><span class="label label-' + (log.level == 'ERROR' ? 'danger' : log.level == 'WARN' ? 'warning' : 'info') + '">' + log.level + '</span></td>';
                    html += '<td>' + log.message + '</td>';
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
            } else {
                html = '<div class="alert alert-info">No logs available</div>';
            }
            $('#logsContent').html(html);
        });
    }
    
    function exportConfiguration() {
        var config = {
            apiBaseUrl: $('#apiBaseUrl').val(),
            frontendUrl: $('#frontendUrl').val(),
            apiTimeout: $('#apiTimeout').val(),
            enableOtp: $('#enableOtp').val(),
            auditLogging: $('#auditLogging').val()
        };
        
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "patientpassport-config.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        showMessage('Configuration exported successfully', 'success');
    }
    
    function searchPatients() {
        var query = $('#patientSearch').val();
        if (!query.trim()) {
            showMessage('Please enter a search term', 'warning');
            return;
        }
        
        $('#searchResults').show();
        $('#searchResults').html('<div class="text-center"><i class="icon-spinner icon-spin"></i> Searching...</div>');
        
        $.get('searchPatients.form', { query: query }, function(response) {
            var html = '';
            if (response.success && response.patients) {
                if (response.patients.length > 0) {
                    html = '<table class="table table-striped">';
                    html += '<thead><tr><th>Patient ID</th><th>Name</th><th>Has Passport</th><th>Actions</th></tr></thead>';
                    html += '<tbody>';
                    
                    $.each(response.patients, function(index, patient) {
                        html += '<tr>';
                        html += '<td>' + patient.patientId + '</td>';
                        html += '<td>' + patient.name + '</td>';
                        html += '<td>' + (patient.hasPassport ? '<span class="label label-success">Yes</span>' : '<span class="label label-default">No</span>') + '</td>';
                        html += '<td>';
                        html += '<a href="view.htm?patientId=' + patient.patientId + '" class="btn btn-sm btn-primary">View Passport</a>';
                        if (!patient.hasPassport) {
                            html += ' <button class="btn btn-sm btn-success" onclick="createPassport(' + patient.patientId + ')">Create Passport</button>';
                        }
                        html += '</td>';
                        html += '</tr>';
                    });
                    
                    html += '</tbody></table>';
                } else {
                    html = '<div class="alert alert-info">No patients found matching your search criteria.</div>';
                }
            } else {
                html = '<div class="alert alert-danger">Error searching patients: ' + (response.message || 'Unknown error') + '</div>';
            }
            $('#searchResults').html(html);
        });
    }
    
    function createPassport(patientId) {
        if (confirm('This will create a new patient passport in the external system. Continue?')) {
            var frontendUrl = $('#frontendUrl').val();
            if (frontendUrl) {
                window.open(frontendUrl + '?action=create&patientId=' + patientId, '_blank');
            } else {
                showMessage('Please configure the frontend URL first', 'warning');
            }
        }
    }
    
    function loadStatistics() {
        $.get('getStatistics.form', function(response) {
            if (response.success) {
                $('#totalPatients').text(response.totalPatients || 0);
                $('#totalAccesses').text(response.totalAccesses || 0);
                $('#emergencyAccesses').text(response.emergencyAccesses || 0);
                $('#lastSync').text(response.lastSync || 'Never');
            }
        });
    }
    
    function loadRecentActivity() {
        $.get('getRecentActivity.form', function(response) {
            var html = '';
            if (response.success && response.activities) {
                if (response.activities.length > 0) {
                    html = '<table class="table table-striped">';
                    html += '<thead><tr><th>Time</th><th>User</th><th>Action</th><th>Patient</th></tr></thead>';
                    html += '<tbody>';
                    
                    $.each(response.activities, function(index, activity) {
                        html += '<tr>';
                        html += '<td>' + new Date(activity.timestamp).toLocaleString() + '</td>';
                        html += '<td>' + activity.user + '</td>';
                        html += '<td>' + activity.action + '</td>';
                        html += '<td>' + activity.patient + '</td>';
                        html += '</tr>';
                    });
                    
                    html += '</tbody></table>';
                } else {
                    html = '<div class="alert alert-info">No recent activity found.</div>';
                }
            } else {
                html = '<div class="alert alert-danger">Error loading recent activity.</div>';
            }
            $('#recentActivity').html(html);
        });
    }
    
    function showMessage(message, type) {
        var alertClass = type == 'success' ? 'alert-success' : type == 'error' ? 'alert-danger' : 'alert-warning';
        var html = '<div class="alert ' + alertClass + ' alert-dismissible" role="alert">';
        html += '<button type="button" class="close" data-dismiss="alert">&times;</button>';
        html += message;
        html += '</div>';
        
        // Insert at the top of the page
        $('.manage-content').prepend(html);
        
        // Auto-dismiss after 5 seconds
        setTimeout(function() {
            $('.alert').fadeOut();
        }, 5000);
    }
</script>

<style>
.patientpassport-manage-container {
    margin: 20px;
}

.manage-header {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e0e0e0;
}

.manage-description {
    color: #666;
    font-size: 16px;
    margin-top: 10px;
}

.config-section, .actions-section, .stats-section, .search-section, .activity-section {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background-color: #f9f9f9;
}

.config-section h3, .actions-section h3, .stats-section h3, .search-section h3, .activity-section h3 {
    margin-top: 0;
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
}

.config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
}

.config-item {
    display: flex;
    flex-direction: column;
}

.config-item label {
    font-weight: bold;
    margin-bottom: 5px;
}

.config-control {
    display: flex;
    gap: 10px;
    align-items: center;
}

.config-control input, .config-control select {
    flex: 1;
}

.action-buttons {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.stat-item {
    text-align: center;
    padding: 20px;
    background-color: white;
    border-radius: 5px;
    border: 1px solid #ddd;
}

.stat-number {
    font-size: 2.5em;
    font-weight: bold;
    color: #3498db;
    margin-bottom: 10px;
}

.stat-label {
    color: #666;
    font-size: 14px;
}

.search-controls {
    margin-bottom: 20px;
}

.search-results {
    margin-top: 20px;
}

.activity-list {
    max-height: 400px;
    overflow-y: auto;
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

.alert {
    margin-bottom: 20px;
}

.alert-dismissible .close {
    right: 0;
}
</style>

<%@ include file="/WEB-INF/template/footer.jsp" %>
