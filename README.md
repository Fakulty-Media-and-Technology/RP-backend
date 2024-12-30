# Reeplay Backend Service

A robust Node.js backend service for video streaming and media management, built with Express.js and MongoDB.

## 🚀 Features

- **Authentication & Authorization**

  - JWT-based authentication
  - Firebase integration
  - Role-based access control
  - Secure password handling with bcrypt

- **Media Management**

  - Video upload and processing
  - AWS S3 storage integration
  - CloudFront CDN distribution
  - FFmpeg media manipulation

- **Streaming Capabilities**

  - Live streaming support
  - Video on demand (VOD)
  - Adaptive bitrate streaming
  - Real-time analytics

- **User Management**
  - Profile management
  - Watch history
  - Preferences
  - Playlists and favorites

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, Firebase Admin
- **Cloud Services**: AWS (S3, MediaConvert, CloudFront)
- **Media Processing**: FFmpeg
- **Real-time Communication**: Socket.io
- **Email Service**: Nodemailer
- **Testing**: Jest, Mocha, Chai, Supertest

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- AWS Account with appropriate credentials
- Firebase project setup
- FFmpeg installed locally

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
npm run dev
```

### Production

```bash
npm start
```

### Testing

```bash
npm test
```

### Please note that this is a typescript project. As such all source code is written in typescript. The tree structure below shows the source code before transpilation and the _npm start_ command internally handles transapilation and running the entry file. The entry file after transpiling will be <span style="color:yellow">./build/src/index.js</span>

### Manual transpilation and running of the application

1. Install dependencies:

```bash
npm install
```

2. Transpile source code to javascript

```bash
npm run build
```

3. Start application with nodejs

```bash
node build/src/index.js
```

## 📁 Project Structure

```
src
 ┣ controllers
 ┃ ┣ admins
 ┃ ┃ ┣ ads.admin.ts
 ┃ ┃ ┣ clients.admin.ts
 ┃ ┃ ┣ dashboard.admin.ts
 ┃ ┃ ┣ enums.admin.ts
 ┃ ┃ ┣ featured.admin.ts
 ┃ ┃ ┣ giftcard.admin.ts
 ┃ ┃ ┣ managemedia.admin.ts
 ┃ ┃ ┣ onboarding.admin.ts
 ┃ ┃ ┣ payouts.admin.ts
 ┃ ┃ ┣ plan-sub.admin.ts
 ┃ ┃ ┣ suggestions.admin.ts
 ┃ ┃ ┣ trailer.admin.ts
 ┃ ┃ ┣ upcoming.admin.ts
 ┃ ┃ ┣ uploads.admin.ts
 ┃ ┃ ┗ users.admin.ts
 ┃ ┣ clients
 ┃ ┃ ┣ livestream.clients.ts
 ┃ ┃ ┣ profile.clients.ts
 ┃ ┃ ┣ vote.clients.ts
 ┃ ┃ ┗ withdrawal.clients.ts
 ┃ ┗ customers
 ┃ ┃ ┣ medias.customer.ts
 ┃ ┃ ┣ notifications.customer.ts
 ┃ ┃ ┣ onboarding.customer.ts
 ┃ ┃ ┣ payment.customer.ts
 ┃ ┃ ┣ profile.customer.ts
 ┃ ┃ ┣ pushNotification.customer.ts
 ┃ ┃ ┣ settings.customer.ts
 ┃ ┃ ┣ upcoming.customer.ts
 ┃ ┃ ┗ vote.custumers.ts
 ┣ cron
 ┃ ┣ CronTaskHandlers.ts
 ┃ ┗ index.ts
 ┣ firebase
 ┃ ┗ firebase.ts
 ┣ livestream
 ┃ ┗ nms.ts
 ┣ middlewares
 ┃ ┣ admin.mw.js
 ┃ ┣ auth.ts
 ┃ ┣ clients.mw.js
 ┃ ┣ customer.gen.mw.js
 ┃ ┣ errors.ts
 ┃ ┣ ls-auth.mw.ts
 ┃ ┗ superadmin.mw.js
 ┣ models
 ┃ ┣ admanager.model.ts
 ┃ ┣ cast_enums.model.ts
 ┃ ┣ category_enums.model.ts
 ┃ ┣ comments.model.ts
 ┃ ┣ contestants.model.ts
 ┃ ┣ donate.model.ts
 ┃ ┣ featured.model.ts
 ┃ ┣ genre_enums.model.ts
 ┃ ┣ giftcard.model.ts
 ┃ ┣ lives.model.ts
 ┃ ┣ notifications.model.ts
 ┃ ┣ paymentDetails.model.ts
 ┃ ┣ payments.model.ts
 ┃ ┣ payouts.model.ts
 ┃ ┣ plans.model.ts
 ┃ ┣ poster.model.ts
 ┃ ┣ rating.model.ts
 ┃ ┣ subscription.model.ts
 ┃ ┣ subtitle.model.ts
 ┃ ┣ suggestions.model.ts
 ┃ ┣ trailer.model.ts
 ┃ ┣ upcoming.model.ts
 ┃ ┣ userDevice.model.ts
 ┃ ┣ userSettings.model.ts
 ┃ ┣ users.model.ts
 ┃ ┣ videos.model.ts
 ┃ ┣ voteInfo.model.ts
 ┃ ┣ votes.model.ts
 ┃ ┗ wallet.model.ts
 ┣ notifications
 ┃ ┗ notification.ts
 ┣ paymentIntegration
 ┃ ┣ index.ts
 ┃ ┗ paystack.ts
 ┣ public
 ┃ ┗ static
 ┃ ┃ ┣ failed.png
 ┃ ┃ ┗ success.png
 ┣ repositories
 ┃ ┣ AddManagerRepo.ts
 ┃ ┣ CastEnumRepo.ts
 ┃ ┣ CategoryEnumService.ts
 ┃ ┣ GenreRepo.ts
 ┃ ┣ LiveRepo.ts
 ┃ ┣ PaymentDetailRepo.ts
 ┃ ┣ PaymentRepo.ts
 ┃ ┣ PosterImageRepo.ts
 ┃ ┣ SubscriptionRepo.ts
 ┃ ┣ UserRepo.ts
 ┃ ┣ VideoRepo.ts
 ┃ ┗ WalletRepo.ts
 ┣ routes
 ┃ ┣ admin.route.ts
 ┃ ┣ clients.route.ts
 ┃ ┣ customers.route.ts
 ┃ ┣ index.ts
 ┃ ┗ superadmin.route.ts
 ┣ services
 ┃ ┣ aws
 ┃ ┃ ┣ mediaConvert.ts
 ┃ ┃ ┣ s3.ts
 ┃ ┃ ┗ utils.ts
 ┃ ┣ core
 ┃ ┃ ┣ AdmanagerService.ts
 ┃ ┃ ┣ CastEnumService.ts
 ┃ ┃ ┣ category_enumssService.ts
 ┃ ┃ ┣ ClientProfileService.ts
 ┃ ┃ ┣ ClientService.ts
 ┃ ┃ ┣ CustomenrPaymentService.ts
 ┃ ┃ ┣ CustomerProfileService.ts
 ┃ ┃ ┣ CustomerSettingsService.ts
 ┃ ┃ ┣ CustomerUpcomingService.ts
 ┃ ┃ ┣ CustomerVoteService.ts
 ┃ ┃ ┣ DashboardService.ts
 ┃ ┃ ┣ FeaturedService.ts
 ┃ ┃ ┣ GenreService.ts
 ┃ ┃ ┣ GiftCardService.ts
 ┃ ┃ ┣ LiveService.ts
 ┃ ┃ ┣ LiveStreamService.ts
 ┃ ┃ ┣ NotificationService.ts
 ┃ ┃ ┣ OnboardingService.ts
 ┃ ┃ ┣ PushNotificationService.ts
 ┃ ┃ ┣ VideoService.ts
 ┃ ┃ ┣ VoteService.ts
 ┃ ┃ ┗ WithdrawalService.ts
 ┃ ┣ media-access.ts
 ┃ ┣ media-management.ts
 ┃ ┣ notification.service.ts
 ┃ ┗ unique-ref.ts
 ┣ socket
 ┃ ┗ socketEvents.ts
 ┣ types
 ┃ ┗ index.d.ts
 ┣ utils
 ┃ ┣ Assets.ts
 ┃ ┣ Bytes.ts
 ┃ ┣ Catch.ts
 ┃ ┣ FileHandler.ts
 ┃ ┣ GetDefined.ts
 ┃ ┣ Multer.ts
 ┃ ┣ OperationalError.ts
 ┃ ┣ Password.ts
 ┃ ┣ QueryParamsFeatures.ts
 ┃ ┣ aady-push-firebase-adminsdk-gu1c3-3ca0f82cbc.json
 ┃ ┣ connectDB.ts
 ┃ ┣ date.ts
 ┃ ┣ denyGuestUser.ts
 ┃ ┣ emailer.ts
 ┃ ┣ jwt.ts
 ┃ ┣ mongoDbSessionRunner.ts
 ┃ ┣ nms.ts
 ┃ ┣ responder.ts
 ┃ ┣ strGen.ts
 ┃ ┗ validate.ts
 ┣ views
 ┃ ┣ autorenew-fail.ejs
 ┃ ┣ autorenew-success.ejs
 ┃ ┣ reset-pass.ejs
 ┃ ┗ verify-email.ejs
 ┣ app.ts
 ┣ env.ts
 ┣ index.ts
 ┗ reeplay-4a7cd-05669a07cbd9.json
```

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Media Endpoints

- `POST /api/media/upload` - Upload media
- `GET /api/media/stream/:id` - Stream media
- `GET /api/media/list` - List available media
- `PUT /api/media/:id` - Update media metadata

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/history` - Get watch history
- `POST /api/users/favorites` - Manage favorites

## 🧪 Testing

The project uses multiple testing frameworks:

- Unit tests with Jest
- Integration tests with Mocha and Chai
- API testing with Supertest

Run tests with:

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
```

## 🔐 Security

- JWT token-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Security headers with Helmet.js

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

- Application logging with Winston
- Error tracking
- Performance monitoring
- API usage metrics

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

- [Developer Name] - _Initial work_ - [GitHub Profile]
- [Developer Name] - _Feature X_ - [GitHub Profile]

## 📞 Support

For support, email [support@email.com] or join our Slack channel.

## 🙏 Acknowledgments

- List any third-party services or libraries that deserve special mention
- Credits to team members or contributors
- Inspiration sources
