# Deployment Guide - Fix Login and Upload Issues

## Environment Variables Required

Make sure these environment variables are set in your deployment platform (Vercel, Heroku, etc.):

### Required Variables:
```
MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
OPENAI_API_KEY=your-openai-api-key-here
FRONTEND_URL=https://your-frontend-domain.vercel.app
NODE_ENV=production
```

### Optional Variables:
```
PORT=5000
```

## Common Issues and Solutions

### 1. Login Fails
**Symptoms:** Users can't log in, getting "Invalid credentials" or "Server error"

**Causes:**
- Missing `JWT_SECRET` environment variable
- Missing `MONGO_URI` environment variable
- Database connection issues
- CORS issues

**Solutions:**
- Check that `JWT_SECRET` is set in your deployment environment
- Verify `MONGO_URI` is correct and accessible
- Check server logs for database connection errors
- Ensure CORS is properly configured

### 2. Upload Fails
**Symptoms:** File uploads fail, getting "No file uploaded" or "File too large"

**Causes:**
- Missing authentication token
- File size too large
- CORS issues
- Missing environment variables

**Solutions:**
- Ensure user is logged in and token is sent in Authorization header
- Check file size (max 10MB)
- Verify CORS configuration includes your frontend domain
- Check server logs for detailed error messages

### 3. CORS Issues
**Symptoms:** Requests blocked by browser, "CORS error" in console

**Solutions:**
- Update `FRONTEND_URL` in environment variables
- Add your frontend domain to the CORS origins list in `server/index.js`
- Ensure credentials are enabled in CORS configuration

## Testing Your Deployment

### 1. Health Check
Test if your server is running:
```
GET https://your-backend-domain.vercel.app/api/health
```

### 2. Test Login
```
POST https://your-backend-domain.vercel.app/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### 3. Test Upload (requires authentication)
```
POST https://your-backend-domain.vercel.app/api/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

file: [your-excel-file]
```

## Debugging Steps

1. **Check Environment Variables:**
   - Verify all required variables are set in your deployment platform
   - Use the health check endpoint to see which variables are missing

2. **Check Server Logs:**
   - Look for error messages in your deployment platform's logs
   - The updated code now includes detailed logging

3. **Test Database Connection:**
   - Verify your MongoDB connection string is correct
   - Check if your database is accessible from your deployment platform

4. **Test CORS:**
   - Open browser developer tools
   - Look for CORS errors in the Network tab
   - Update CORS configuration if needed

## Updated Features

The code has been updated with:
- Better error handling and logging
- Increased file upload limits (10MB)
- Improved CORS configuration
- Health check endpoint
- Detailed console logging for debugging
- Environment variable validation

## Frontend Configuration

Make sure your frontend is configured to:
- Send requests to the correct backend URL
- Include the JWT token in Authorization header
- Handle file uploads with proper authentication
- Handle CORS preflight requests 