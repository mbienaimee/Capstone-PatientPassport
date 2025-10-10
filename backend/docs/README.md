# PatientPassport API Documentation

This directory contains the comprehensive Swagger/OpenAPI documentation for the PatientPassport API.

## 📁 Files

- **`swagger.yml`** - Complete OpenAPI 3.0 specification in YAML format
- **`serve-swagger.js`** - Standalone server to serve the documentation
- **`README.md`** - This documentation guide

## 🚀 Quick Start

### Option 1: Serve Documentation Standalone

1. **Install dependencies** (if not already installed):
   ```bash
   cd backend
   npm install
   ```

2. **Start the documentation server**:
   ```bash
   npm run docs
   ```

3. **Open your browser** and go to:
   ```
   http://localhost:3001/api-docs
   ```

### Option 2: Use with Main API Server

The main API server also includes Swagger documentation at:
```
http://localhost:5000/api-docs
```

## 📚 Documentation Features

### **Complete API Coverage**
- **Authentication**: User registration, login, profile management
- **Patients**: Patient management and medical records
- **Hospitals**: Hospital registration and approval workflow
- **Medical Records**: Conditions, medications, test results, visits
- **Dashboard**: Role-specific analytics and statistics

### **Interactive Features**
- **Try It Out**: Test all endpoints directly from the browser
- **Authentication**: Built-in JWT token testing
- **Request/Response Examples**: Real examples for all endpoints
- **Schema Validation**: See exact data formats required

### **Developer-Friendly**
- **Multiple Formats**: YAML, JSON, and interactive UI
- **Code Examples**: Request/response examples in multiple languages
- **Error Documentation**: Complete error response schemas
- **Role-Based Access**: Clear documentation of permissions

## 🔧 Available Endpoints

### **Documentation Endpoints**
- `GET /` - Redirects to documentation
- `GET /api-docs` - Interactive Swagger UI
- `GET /swagger.yml` - Raw YAML specification
- `GET /swagger.json` - JSON specification
- `GET /health` - Documentation server health check

### **API Endpoints** (Documented in swagger.yml)
- **Authentication** (`/api/auth`)
- **Patients** (`/api/patients`)
- **Hospitals** (`/api/hospitals`)
- **Medical Records** (`/api/medical`)
- **Dashboard** (`/api/dashboard`)

## 🛠️ Customization

### **Styling**
The documentation includes custom CSS for a professional look:
- Green theme matching PatientPassport branding
- Clean, modern interface
- Responsive design

### **Configuration**
You can modify the documentation server settings in `serve-swagger.js`:
- Port: Change `SWAGGER_PORT` environment variable
- Custom CSS: Modify the `customCss` option
- Swagger options: Update `swaggerOptions` object

## 📖 Using the Documentation

### **1. Authentication**
1. Go to the Authentication section
2. Use the `/api/auth/register` endpoint to create a test user
3. Use the `/api/auth/login` endpoint to get a JWT token
4. Click the "Authorize" button and enter your token

### **2. Testing Endpoints**
1. Find the endpoint you want to test
2. Click "Try it out"
3. Fill in the required parameters
4. Click "Execute"
5. View the response

### **3. Understanding Schemas**
- Click on any schema name to see its structure
- View required fields and data types
- See example values for each field

## 🔍 Schema Reference

### **Core Models**
- **User**: Base user information and authentication
- **Patient**: Patient medical profile and records
- **Hospital**: Hospital information and management
- **Doctor**: Medical credentials and specializations

### **Medical Models**
- **MedicalCondition**: Patient medical conditions
- **Medication**: Patient medications and prescriptions
- **TestResult**: Laboratory and diagnostic results
- **HospitalVisit**: Hospital visits and consultations

### **Request/Response Models**
- **RegisterRequest**: User registration data
- **LoginRequest**: Authentication data
- **ApiResponse**: Standard API response format
- **ErrorResponse**: Error response format
- **Pagination**: Pagination metadata

## 🌐 Integration

### **Frontend Integration**
The documentation can be used to:
- Generate TypeScript types for frontend
- Understand API contracts
- Test API endpoints during development
- Validate request/response formats

### **API Testing Tools**
The YAML file can be imported into:
- Postman
- Insomnia
- VS Code REST Client
- Any OpenAPI-compatible tool

## 📝 Updating Documentation

### **Adding New Endpoints**
1. Add the endpoint to the appropriate route file
2. Update `swagger.yml` with the new endpoint definition
3. Include request/response schemas
4. Add examples and descriptions

### **Modifying Schemas**
1. Update the schema definition in `swagger.yml`
2. Ensure examples match the new schema
3. Update any related endpoint documentation

## 🚀 Deployment

### **Production Documentation**
For production deployment:
1. Serve the YAML file from your CDN
2. Update server URLs in the YAML file
3. Configure authentication for protected documentation
4. Set up monitoring for documentation usage

### **CI/CD Integration**
- Validate YAML syntax in CI pipeline
- Generate client SDKs from documentation
- Deploy documentation with API updates

## 📞 Support

For questions about the API documentation:
- Check the interactive documentation first
- Review the schema definitions
- Test endpoints using the "Try it out" feature
- Contact the development team for clarification

---

**Happy API Development! 🎉**











































