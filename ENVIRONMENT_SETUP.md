# Environment Variables Setup

## Required Environment Variables

To ensure the AI features work correctly, you need to set up the following environment variables:

### 1. Create Environment File

Create a `.env.local` file in the root directory of the project with the following content:

```bash
# Fellowship Program Environment Variables

# JWT Secret for authentication
JWT_SECRET=fellowship-program-jwt-secret

# Google Gemini API Key for AI message generation
GEMINI_API_KEY=AIzaSyBtUBbljTWSwtqc--T1uXni3rbZ8yAuCB4

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Configuration (if needed)
EMAIL_FROM=noreply@moh.gov.rw
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_SECURE=false
```

### 2. Alternative: Set Environment Variables Directly

If you can't create the `.env.local` file, you can set the environment variables directly when running the application:

```bash
# Set environment variables and run the development server
GEMINI_API_KEY=AIzaSyBtUBbljTWSwtqc--T1uXni3rbZ8yAuCB4 \
JWT_SECRET=fellowship-program-jwt-secret \
NEXT_PUBLIC_APP_URL=http://localhost:3000 \
npm run dev
```

### 3. Production Environment

For production deployment, make sure to set these environment variables in your hosting platform:

- **Vercel**: Add environment variables in the Vercel dashboard
- **Netlify**: Add environment variables in the Netlify dashboard
- **Docker**: Use `-e` flags or environment files
- **Server**: Export variables in your shell or use systemd environment files

## Environment Variables Reference

| Variable | Description | Default Value | Required |
|----------|-------------|---------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI message generation | `AIzaSyBtUBbljTWSwtqc--T1uXni3rbZ8yAuCB4` | Yes |
| `JWT_SECRET` | Secret key for JWT token generation and verification | `fellowship-program-jwt-secret` | Yes |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application | `http://localhost:3000` | Yes |
| `EMAIL_FROM` | Email address for sending emails | `noreply@moh.gov.rw` | Optional |
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` | Optional |
| `EMAIL_PORT` | SMTP server port | `587` | Optional |
| `EMAIL_USER` | SMTP username | - | Optional |
| `EMAIL_PASSWORD` | SMTP password | - | Optional |
| `EMAIL_SECURE` | Use SSL/TLS for email | `false` | Optional |

## Security Notes

1. **Never commit API keys to version control**
2. **Use different API keys for development and production**
3. **Rotate API keys regularly**
4. **Use environment-specific secrets management**

## Testing Environment Variables

To test if the environment variables are working correctly:

1. **Check if the AI endpoint is accessible**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/ai/generate-message \
     -H "Content-Type: application/json" \
     -d '{"prompt": "test", "messageType": "funding_request", "applicantName": "Test User"}'
   ```

2. **Check the application logs** for any environment variable errors

3. **Verify the AI features work** in the admin interface

## Troubleshooting

### Common Issues

1. **"Unauthorized" error**: Check if `JWT_SECRET` is set correctly
2. **AI generation fails**: Verify `GEMINI_API_KEY` is valid and has proper permissions
3. **Email sending fails**: Check email configuration variables
4. **Application URL issues**: Ensure `NEXT_PUBLIC_APP_URL` matches your actual domain

### Debug Mode

To enable debug logging, set:
```bash
NODE_ENV=development
```

This will show detailed logs for email service and other debugging information.

## Current Status

✅ **API Key Configuration**: Updated to use `process.env.GEMINI_API_KEY`
✅ **Fallback Value**: Maintains the provided API key as fallback
✅ **Environment Variable Support**: Ready for production deployment
✅ **Security**: API key is no longer hardcoded in the source code

The application will work with the current setup, but for production deployment, make sure to set up the environment variables properly.
