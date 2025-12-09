# FindNest Backend

Hệ thống backend cho ứng dụng tìm kiếm phòng trọ thông minh FindNest, được xây dựng trên AWS với kiến trúc serverless.

## Kiến trúc hệ thống

### Công nghệ sử dụng
- **Backend**: Node.js 20.x với Express.js
- **Database**: Amazon DynamoDB
- **Authentication**: Amazon Cognito
- **Storage**: Amazon S3
- **AI**: Amazon Bedrock (Claude 3 Sonnet)
- **Location**: Amazon Location Service
- **Infrastructure**: AWS CDK (TypeScript)
- **API Gateway**: AWS API Gateway

### Cấu trúc thư mục

#### 1. Lambda Functions (Backend API)
```
backend/
├── scripts/                   # Scripts tiện ích
│   ├── .env                   # Environment variables cho scripts
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   └── seed-admin.js          # Tạo admin user đầu tiên
├── src/lambda/                # Lambda function code
│   ├── api/                   # API endpoints
│   │   ├── admin/             # Quản trị hệ thống
│   │   │   ├── admin.controller.js
│   │   │   ├── admin.router.js
│   │   │   └── admin.service.js
│   │   ├── ai/                # Tìm kiếm AI
│   │   │   ├── ai.controller.js
│   │   │   ├── ai.router.js
│   │   │   └── ai.service.js
│   │   ├── analytics/         # Phân tích dữ liệu
│   │   │   └── analytics.service.js
│   │   ├── auth/              # Xác thực người dùng
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.middleware.js
│   │   │   ├── auth.router.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.utils.js
│   │   ├── favorites/         # Yêu thích
│   │   │   ├── favorites.controller.js
│   │   │   ├── favorites.router.js
│   │   │   └── favorites.service.js
│   │   ├── images/            # Upload hình ảnh
│   │   │   ├── images.controller.js
│   │   │   ├── images.router.js
│   │   │   └── images.service.js
│   │   ├── landlord/          # Chức năng chủ trọ
│   │   │   ├── landlord.controller.js
│   │   │   └── landlord.router.js
│   │   ├── listings/          # Quản lý tin đăng
│   │   │   ├── listings.controller.js
│   │   │   ├── listings.router.js
│   │   │   ├── listings.service.js
│   │   │   └── listings.validator.js
│   │   ├── location/          # Dịch vụ vị trí
│   │   │   ├── location.controller.js
│   │   │   ├── location.router.js
│   │   │   └── location.service.js
│   │   ├── notifications/     # Thông báo
│   │   │   ├── notifications.controller.js
│   │   │   ├── notifications.router.js
│   │   │   ├── notifications.service.js
│   │   │   └── weekly-digest.service.js
│   │   ├── profiles/          # Hồ sơ người dùng
│   │   │   ├── profiles.controller.js
│   │   │   ├── profiles.router.js
│   │   │   └── profiles.service.js
│   │   ├── support/           # Hỗ trợ khách hàng
│   │   │   ├── support.controller.js
│   │   │   ├── support.router.js
│   │   │   └── support.service.js
│   │   └── system/            # Hệ thống
│   │       ├── cleanup.service.js
│   │       ├── rate-limit.middleware.js
│   │       └── system.service.js
│   ├── .env                   # Environment variables (local)
│   ├── .gitignore
│   ├── app.js                 # Express app configuration
│   ├── index.js               # Lambda handler
│   ├── local.js               # Local development server
│   ├── nodemon.json           # Nodemon configuration
│   ├── package.json           # Dependencies
│   ├── package-lock.json
│   └── swagger.yaml           # API documentation
└── package-lock.json          # Backend root dependencies
```

#### 2. Infrastructure (AWS CDK)
```
cdk/
├── bin/
│   ├── backend.ts             # CDK app entry point
│   ├── backend.js             # Compiled JS
│   └── backend.d.ts           # TypeScript definitions
├── lib/
│   ├── backend-stack.ts       # Main infrastructure stack
│   ├── backend-stack.js       # Compiled JS
│   ├── monitoring-stack.ts    # Monitoring stack
│   └── monitoring-stack.js    # Compiled JS
├── cdk.out/                   # CDK build output
├── .gitignore
├── .npmignore
├── cdk.json                   # CDK configuration
├── jest.config.js             # Jest test configuration
├── package.json
├── package-lock.json
├── README.md
└── tsconfig.json              # TypeScript configuration
```

#### 3. Root Files
```
findnest-backend/
├── .gitignore
├── .gitlab-ci.yml             # GitLab CI/CD pipeline
├── package-lock.json          # Root dependencies
└── README.md
```

## Tính năng chính

### Hệ thống người dùng
- **Người dùng thường**: Đăng nhập bằng OTP qua SMS, tìm kiếm và lưu phòng yêu thích
- **Chủ trọ**: Đăng tin, quản lý phòng trọ, upload hình ảnh
- **Quản trị viên**: Quản lý toàn hệ thống, xử lý yêu cầu hỗ trợ

### Tìm kiếm thông minh
- Tìm kiếm bằng ngôn ngữ tự nhiên với AI
- Lọc theo vị trí, giá, diện tích, tiện ích
- Gợi ý phòng dựa trên lịch sử tìm kiếm
- Tìm kiếm theo khoảng cách địa lý

### Dịch vụ bản đồ
- Tích hợp Amazon Location Service
- Geocoding và reverse geocoding
- Tính toán khoảng cách và tuyến đường
- Hiển thị phòng trọ trên bản đồ

### AI & Machine Learning
- Phân tích yêu cầu bằng tiếng Việt tự nhiên
- Gợi ý phòng trọ phù hợp
- Tìm khu vực tương tự
- Cá nhân hóa trải nghiệm người dùng

## Yêu cầu hệ thống

- Node.js 20.x
- AWS CLI đã cấu hình
- AWS CDK CLI (`npm install -g aws-cdk`)
- Tài khoản AWS với quyền tạo resources

## Cài đặt và triển khai

### 1. Clone repository
```bash
git clone <repository-url>
cd findnest-backend
```

### 2. Cài đặt dependencies

#### Backend Lambda
```bash
cd backend/src/lambda
npm install
```

#### CDK Infrastructure
```bash
cd ../../../cdk
npm install
```

### 3. Cấu hình AWS
```bash
aws configure
# Nhập AWS Access Key, Secret Key, Region (us-east-1)
```

### 4. Triển khai infrastructure
```bash
cd cdk
npm run build
npx cdk bootstrap  # Chỉ chạy lần đầu
npx cdk deploy
```

### 5. Tạo admin user đầu tiên
```bash
cd ../backend/scripts
npm install
node seed-admin.js
```

## Phát triển local

### Chạy API local
```bash
cd backend/src/lambda
npm run dev
# API sẽ chạy tại http://localhost:3001
```

### Xem API documentation
- Local: http://localhost:3001/api-docs
- Production: https://your-api-url/api-docs

### Chạy tests
```bash
cd backend/src/lambda
npm test
```

## Monitoring và Logs

### CloudWatch Logs
```bash
# Xem logs qua AWS CLI
aws logs tail /aws/lambda/FindNestApi --follow
```

### Admin Dashboard
- Truy cập `/admin/logs` để xem system logs
- Thống kê hệ thống tại `/admin/stats`

## Bảo mật

### Authentication Flow
1. **Users**: Phone + OTP → Auto tạo tài khoản → JWT tokens
2. **Admins**: Username + Password → JWT tokens

### Authorization
- JWT tokens với expiry time
- Role-based access control (User/Landlord/Admin)
- API rate limiting

### Data Protection
- Mã hóa dữ liệu trong DynamoDB
- S3 bucket private với presigned URLs
- CORS configuration

## Environment Variables

Các biến môi trường được CDK tự động cấu hình:

```bash
LISTINGS_TABLE_NAME=BoardingHouseListings
USER_PROFILES_TABLE_NAME=UserProfiles
OTP_TABLE_NAME=OTPVerifications
FAVORITES_TABLE_NAME=UserFavorites
SUPPORT_REQUESTS_TABLE_NAME=SupportRequests
SEARCH_HISTORY_TABLE_NAME=SearchHistory
USER_PREFERENCES_TABLE_NAME=UserPreferences
IMAGES_BUCKET_NAME=findnest-images-{account-id}
USER_POOL_ID=us-east-1_xxxxxxxxx
USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
PLACE_INDEX_NAME=FindNestPlaces
MAP_NAME=FindNestMap
ROUTE_CALCULATOR_NAME=FindNestRoutes
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
REGION=us-east-1
```

### Scaling
- Lambda auto-scaling
- DynamoDB on-demand billing
- API Gateway throttling

## Troubleshooting

**FindNest Team** - Tìm phòng trọ thông minh với AI