# FindNest

Ứng dụng tìm kiếm và quản lý địa điểm sử dụng AWS services.

## Cấu trúc dự án

```
findNest/
├── api/              # Backend API và Infrastructure
│   ├── backend/      # Lambda functions
│   └── cdk/          # AWS CDK Infrastructure as Code
└── website/          # Frontend React application
```

## Công nghệ

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js với AWS Serverless Express
- **AWS Services**: 
  - Lambda, DynamoDB, S3, Cognito
  - Location Services, Bedrock, SNS, CloudWatch
- **Infrastructure**: AWS CDK (TypeScript)

### Frontend
- **Framework**: React 19 + Vite
- **UI**: Ant Design, Tailwind CSS
- **State**: Redux Toolkit
- **Maps**: MapLibre GL
- **Routing**: React Router v7

## Cài đặt

### Backend

```bash
cd api/backend/src/lambda
npm install
npm run dev
```

### Infrastructure

```bash
cd api/cdk
npm install
npm run deploy
```

### Frontend

```bash
cd website
npm install
npm run dev
```

## Scripts

### Backend
- `npm run dev` - Chạy local development
- `npm test` - Chạy tests
- `npm run lint` - Kiểm tra syntax

### CDK
- `npm run synth` - Tạo CloudFormation template
- `npm run deploy` - Deploy lên AWS
- `npm run destroy` - Xóa stack

### Frontend
- `npm run dev` - Development server
- `npm run build` - Build production
- `npm run preview` - Preview production build

## CI/CD

Sử dụng GitLab CI/CD (xem `.gitlab-ci.yml`)
