# Backend Scripts

## Seed Admin Script

Script để tạo admin user đầu tiên trong hệ thống.

### Prerequisites

1. Đã deploy CDK stack thành công
2. Có các environment variables từ CDK outputs:
   - `USER_POOL_ID`
   - `USER_PROFILES_TABLE_NAME`
   - `REGION`

### Setup

```bash
cd backend/scripts
npm install
```

### Create .env file

Tạo file `.env` trong thư mục `backend/scripts`:

```env
REGION=us-east-1
USER_POOL_ID=us-east-1_NYUDwhJFJ
USER_PROFILES_TABLE_NAME=UserProfiles
```

**Lấy values từ CDK outputs:**

```bash
cd cdk
cdk deploy --outputs-file outputs.json
# Check outputs.json for UserPoolId
```

### Usage

#### Option 1: Using npm script

```bash
npm run seed-admin
```

#### Option 2: Using node directly

```bash
node seed-admin.js
```

#### Option 3: With inline environment variables

```bash
USER_POOL_ID=xxx USER_PROFILES_TABLE_NAME=xxx node seed-admin.js
```

### Script Flow

1. **Validate Environment**: Check required env vars
2. **Collect Input**: Prompt for admin details
   - Username (3-20 chars, alphanumeric, \_, -)
   - Password (min 8 chars with complexity requirements)
   - Email
   - Full Name (optional)
3. **Validation**: Validate all inputs
4. **Confirmation**: Show summary and ask for confirmation
5. **Create User**:
   - Create user in Cognito User Pool
   - Set permanent password
   - Add to "Admins" group
   - Create profile in DynamoDB
6. **Success**: Display credentials

### Example Session

```
═══════════════════════════════════════════════
   🔐 SEED ADMIN USER SCRIPT
   Smart Boarding House - Admin Creation
═══════════════════════════════════════════════

✅ Environment variables loaded:
   Region: us-east-1
   User Pool ID: us-east-1_NYUDwhJFJ
   User Profiles Table: UserProfiles

Please enter the admin user details:

Username (3-20 chars, alphanumeric, _, -): admin01
Password (min 8 chars, uppercase, lowercase, digit, special char): Admin@123
Confirm password: Admin@123
Email: admin@example.com
Full Name (optional, press Enter to skip): Super Admin

═══════════════════════════════════════════════
Summary:
  Username:  admin01
  Email:     admin@example.com
  Full Name: Super Admin
═══════════════════════════════════════════════

Create this admin user? (yes/no): yes

🚀 Creating admin user...

📝 Creating admin user in Cognito...
   ✅ User created with ID: 12345678-1234-1234-1234-123456789012
🔑 Setting permanent password...
   ✅ Password set
👑 Adding user to Admins group...
   ✅ Added to Admins group
📝 Creating admin profile in DynamoDB...
   ✅ Profile created

═══════════════════════════════════════════════
✅ ADMIN USER CREATED SUCCESSFULLY!
═══════════════════════════════════════════════

Admin credentials:
  Username: admin01
  Password: Admin@123
  User ID:  12345678-1234-1234-1234-123456789012

⚠️  IMPORTANT: Save these credentials securely!
   You can now login at: POST /auth/admin/login
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (!@#$%^&\*()\_+-=[]{}|;:,.<>?)

### Troubleshooting

#### Error: USER_POOL_ID environment variable is required

Solution: Create `.env` file or export environment variables

```bash
export USER_POOL_ID=us-east-1_NYUDwhJFJ
export USER_PROFILES_TABLE_NAME=UserProfiles
```

#### Error: User already exists

Solution: Use a different username or delete the existing user first

#### Error: Access Denied

Solution: Ensure your AWS credentials have permissions to:

- `cognito-idp:AdminCreateUser`
- `cognito-idp:AdminSetUserPassword`
- `cognito-idp:AdminAddUserToGroup`
- `dynamodb:PutItem`

### Testing Admin Login

After creating admin, test login:

```bash
curl -X POST https://your-api-url/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin01",
    "password": "Admin@123"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Admin authentication successful",
  "accessToken": "eyJraWQ...",
  "refreshToken": "eyJjdH...",
  "idToken": "eyJraWQ...",
  "expiresIn": 1800,
  "tokenType": "Bearer",
  "admin": {
    "userId": "12345678-1234-1234-1234-123456789012",
    "userType": "admin",
    "cognitoUsername": "admin01",
    "email": "admin@example.com",
    "fullName": "Super Admin",
    ...
  }
}
```
