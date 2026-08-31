# Reeplay Backend Service

A robust Node.js backend service for video streaming and media management, built with Express.js and MongoDB.

## 🚀 Features

-    **Authentication & Authorization**

     -    JWT-based authentication
     -    Firebase integration
     -    Role-based access control
     -    Secure password handling with bcrypt

-    **Media Management**

     -    Video upload and processing
     -    AWS S3 storage integration
     -    CloudFront CDN distribution
     -    FFmpeg media manipulation

-    **Streaming Capabilities**

     -    Live streaming support
     -    Video on demand (VOD)
     -    Adaptive bitrate streaming
     -    Real-time analytics

-    **User Management**
     -    Profile management
     -    Watch history
     -    Preferences
     -    Playlists and favorites

## 🛠️ Tech Stack

-    **Runtime**: Node.js
-    **Framework**: Express.js
-    **Database**: MongoDB with Mongoose
-    **Authentication**: JWT, Firebase Admin
-    **Cloud Services**: AWS (S3, MediaConvert, CloudFront)
-    **Media Processing**: FFmpeg
-    **Real-time Communication**: Socket.io
-    **Email Service**: Nodemailer
-    **Testing**: Jest, Mocha, Chai, Supertest

## 📋 Prerequisites

-    Node.js (v14 or higher)
-    MongoDB
-    AWS Account with appropriate credentials
-    Firebase project setup
-    FFmpeg installed locally

## 🔧 Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/reeplay-backend.git
cd reeplay-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_uri

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
S3_BUCKET=your_s3_bucket

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Other Services
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

## 🚀 Running the Application

### Development

```bash
npm run prest
```

### Production

```bash
npm start
```

### Testing

```bash
npm test
```

## 📁 Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Helper functions
└── index.js        # Entry point
```

## 📝 API Documentation

### Authentication Endpoints

-    `POST /api/auth/register` - User registration
-    `POST /api/auth/login` - User login
-    `POST /api/auth/refresh` - Refresh token
-    `POST /api/auth/logout` - User logout

### Media Endpoints

-    `POST /api/media/upload` - Upload media
-    `GET /api/media/stream/:id` - Stream media
-    `GET /api/media/list` - List available media
-    `PUT /api/media/:id` - Update media metadata

### User Endpoints

-    `GET /api/users/profile` - Get user profile
-    `PUT /api/users/profile` - Update user profile
-    `GET /api/users/history` - Get watch history
-    `POST /api/users/favorites` - Manage favorites

## 🧪 Testing

The project uses multiple testing frameworks:

-    Unit tests with Jest
-    Integration tests with Mocha and Chai
-    API testing with Supertest

Run tests with:

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
```

## 🔐 Security

-    JWT token-based authentication
-    Password hashing with bcrypt
-    Input validation and sanitization
-    Rate limiting
-    CORS configuration
-    Security headers with Helmet.js

## 🚀 Deployment

1. Ensure all environment variables are properly set
2. Build the application:

```bash
npm run build
```

3. Start the server:

```bash
npm start
```

## 📈 Monitoring

-    Application logging with Winston
-    Error tracking
-    Performance monitoring
-    API usage metrics

## DEMO

Links to the app demo
frontend [base_url](https://reeplay.app)
backend [base_url](https://reeplay.app)

## DOCUMENTATION

Link to the published postman documentation
[Documentation](https://documenter.getpostman.com/view/18227483/2sA3JGePHa)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## 👥 Team

-    [Developer Name] - _Initial work_ - [GitHub Profile]
-    [Developer Name] - _Feature X_ - [GitHub Profile]

## 📞 Support

For support, email [support@email.com] or join our Slack channel.

## 🙏 Acknowledgments

-    List any third-party services or libraries that deserve special mention
-    Credits to team members or contributors
-    Inspiration sources


<!-- Security scan triggered at 2026-08-31 18:23:35 -->