# FILE UPLOAD & STORAGE SYSTEM - مکمل implementation guide

> **تاریخ**: 6 دسمبر 2025
> **سسٹم**: Think-Then-Talk Community
> **حالت**: ✅ مکمل اور تمام errors fix

---

## 📋 فہرست

1. [سسٹم کا جائزہ](#سسٹم-کا-جائزہ)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [قدم بہ قدم سیٹ اپ](#قدم-بہ-قدم-سیٹ-اپ)
5. [Errors جو fix کیے گئے](#errors-جو-fix-کیے-گئے)
6. [Testing](#testing)
7. [Production Migration](#production-migration)

---

## سسٹم کا جائزہ

### 🎯 کیا بنایا گیا؟

ایک **modular, scalable file storage system** جو:

- ✅ **Local storage** - Development میں فوری کام کرتا ہے
- ✅ **Cloud storage ready** - S3, Azure, GCS میں آسانی سے switch کر سکتے ہیں
- ✅ **Type-safe** - مکمل TypeScript support
- ✅ **Secure** - JWT authentication + file validation
- ✅ **Production-ready** - Error handling اور logging

### 📁 فائل structure

```
backend/
├── src/
│   ├── infrastructure/storage/
│   │   ├── storage.types.ts           ← Types اور interfaces
│   │   ├── storage.service.ts         ← Main service
│   │   ├── local-storage.provider.ts  ← Local FS
│   │   ├── cloud-storage.provider.ts  ← Cloud (S3/Azure/GCS)
│   │   └── storage.module.ts          ← Storage module
│   ├── upload/
│   │   ├── upload.controller.ts       ← 5 upload endpoints
│   │   └── upload.module.ts
│   └── app.module.ts                  ← Updated with StorageModule
├── uploads/                           ← Local files folder
│   ├── events/
│   ├── users/
│   └── content/
│       ├── team/
│       └── sponsors/
└── .env.storage                       ← Configuration template

frontend/
├── src/
│   ├── lib/
│   │   └── api/
│   │       └── upload.ts              ← Upload API functions
│   └── hooks/
│       └── use-upload.ts              ← React Query hooks
```

---

## Backend Implementation

### 1. Storage Types اور Interfaces

**File**: `src/infrastructure/storage/storage.types.ts`

```typescript
// File categories
enum FileCategory {
  EVENT_POSTER = 'events',
  USER_AVATAR = 'users',
  TEAM_MEMBER = 'content/team',
  SPONSOR_LOGO = 'content/sponsors',
}

// Storage provider interface
interface StorageProvider {
  upload(file, options): Promise<StoredFile>;
  delete(filePath): Promise<void>;
  getUrl(filePath): string;
  // ...
}
```

**فائدے:**
- کوئی بھی provider implement کر سکتے ہیں
- Type-safe implementation
- شامل ہیں تمام options

### 2. Local Storage Provider

**File**: `src/infrastructure/storage/local-storage.provider.ts`

```typescript
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  // فائل validation:
  // - Size limit (50MB default)
  // - MIME type checking
  // - Category-based permissions
  
  async upload(file: Express.Multer.File, options): Promise<StoredFile> {
    // 1. فائل validate کریں
    // 2. Directory create کریں
    // 3. UUID-based filename
    // 4. فائل save کریں
    // 5. StoredFile object return کریں
  }
}
```

**خصوصیات:**
- ✅ Automatic directory creation
- ✅ UUID-based filenames (security)
- ✅ Category organization
- ✅ MIME type validation by category

### 3. Cloud Storage Provider

**File**: `src/infrastructure/storage/cloud-storage.provider.ts`

```typescript
@Injectable()
export class CloudStorageProvider implements StorageProvider {
  // Placeholder for S3/Azure/GCS implementation
  
  async upload(file, options): Promise<StoredFile> {
    // TODO: AWS SDK integration
    // TODO: Azure SDK integration
    // TODO: GCS SDK integration
  }
}
```

**خصوصیات:**
- 🔄 Ready for S3 implementation
- 🔄 Ready for Azure implementation
- 🔄 Ready for GCS implementation

### 4. Storage Service

**File**: `src/infrastructure/storage/storage.service.ts`

```typescript
@Injectable()
export class StorageService {
  // Runtime provider switching
  
  async uploadFile(file: Express.Multer.File, options): Promise<StoredFile> {
    return this.provider.upload(file, options);
  }
  
  switchProvider(storageType: StorageType): void {
    // Environment based automatic switching
  }
}
```

**فائدے:**
- Provider abstraction
- Runtime switching (development ↔ production)
- Single interface سے کام کریں

### 5. Upload Controller

**File**: `src/upload/upload.controller.ts`

#### 5 API Endpoints:

**1. Upload Event Poster**
```
POST /api/v1/upload/event-poster
Content-Type: multipart/form-data

file: <binary image file>

Response:
{
  "id": "uuid",
  "url": "http://localhost:3000/uploads/events/filename.jpg",
  "filename": "filename.jpg",
  "originalName": "my-poster.jpg",
  "size": 2048576
}
```

**2. Upload User Avatar**
```
POST /api/v1/upload/user-avatar
```

**3. Upload Team Member Photo**
```
POST /api/v1/upload/team-member
```

**4. Upload Sponsor Logo**
```
POST /api/v1/upload/sponsor-logo
```

**5. Delete File**
```
DELETE /api/v1/upload/events/filename.jpg
```

### Static Files Serving

**App Module میں added:**

```typescript
ServeStaticModule.forRoot({
  rootPath: path.join(__dirname, '..', 'uploads'),
  serveRoot: '/uploads',
})
```

**نتیجہ:** تمام files `http://localhost:3000/uploads/category/filename` پر accessible ہیں

---

## Frontend Implementation

### 1. Upload API Functions

**File**: `src/lib/api/upload.ts`

```typescript
// HTTP client abstraction
export async function uploadEventPoster(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post<UploadResponse>(
    '/upload/event-poster',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  
  return response.data;
}

// Similar functions for:
// - uploadUserAvatar()
// - uploadTeamMember()
// - uploadSponsorLogo()
// - deleteUploadedFile()
```

### 2. React Query Hooks

**File**: `src/hooks/use-upload.ts`

```typescript
// Easy to use in components
export function useUploadEventPoster() {
  return useMutation({
    mutationFn: async (file: File) => {
      // Client-side validation
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File exceeds 50MB');
      }
      return uploadEventPoster(file);
    },
  });
}

// Similar hooks for:
// - useUploadUserAvatar()
// - useUploadTeamMember()
// - useUploadSponsorLogo()
// - useDeleteUploadedFile()
```

---

## قدم بہ قدم سیٹ اپ

### Phase 1: Backend Setup (✅ مکمل)

```bash
# Step 1: Dependencies install
cd backend
npm install uuid @nestjs/serve-static @types/multer

# Step 2: Files created
# - src/infrastructure/storage/* (4 files)
# - src/upload/* (2 files)
# - uploads/ directory (with .gitkeep)

# Step 3: App Module updated
# - Added ServeStaticModule
# - Added UploadModule

# Step 4: Build verification
npm run build
# ✅ Compilation successful!
```

### Phase 2: Frontend Setup

```bash
# Step 1: API integration (✅ مکمل)
# - frontend/src/lib/api/upload.ts

# Step 2: React Hooks (✅ مکمل)
# - frontend/src/hooks/use-upload.ts

# Step 3: Component integration (manual)
```

### Phase 3: Usage in Components

#### Event Form میں Poster Upload

```typescript
import { useUploadEventPoster } from '@/hooks/use-upload';
import { useCreateEvent } from '@/hooks/use-events';

export function EventForm() {
  const { mutate: uploadPoster, isPending: isUploading } = 
    useUploadEventPoster();
  const { mutate: createEvent } = useCreateEvent();
  
  const handleSubmit = async (formData: EventFormValues) => {
    let posterUrl = formData.posterUrl;
    
    // اگر نیا image select کیا ہے
    if (formData.posterFile) {
      uploadPoster(formData.posterFile, {
        onSuccess: (uploadedData) => {
          posterUrl = uploadedData.url;
          
          // اب event create کریں uploaded URL کے ساتھ
          createEvent({
            ...formData,
            posterUrl,
          });
        },
        onError: (error) => {
          toast.error(`Upload failed: ${error.message}`);
        },
      });
    } else {
      // پرانا URL ہے
      createEvent({ ...formData, posterUrl });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          // File preview دکھائیں
        }}
        disabled={isUploading}
      />
      <button disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Create Event'}
      </button>
    </form>
  );
}
```

#### User Profile Avatar Update

```typescript
import { useUploadUserAvatar } from '@/hooks/use-upload';
import { useUpdateProfile } from '@/hooks/use-profile';

export function ProfileSettings() {
  const { mutate: uploadAvatar } = useUploadUserAvatar();
  const { mutate: updateProfile } = useUpdateProfile();
  
  const handleAvatarChange = (file: File) => {
    uploadAvatar(file, {
      onSuccess: (data) => {
        updateProfile({ avatarUrl: data.url });
        toast.success('Avatar updated!');
      },
      onError: () => {
        toast.error('Failed to upload avatar');
      },
    });
  };
  
  return (
    <div>
      <img src={profile.avatarUrl} alt="Avatar" />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleAvatarChange(e.target.files?.[0]!)}
      />
    </div>
  );
}
```

---

## Errors جو Fix کیے گئے

### ❌ Error Set 1: Missing Dependencies

**Error Messages:**
```
Cannot find module 'uuid'
Cannot find module '@nestjs/serve-static'
Cannot find module '@types/multer'
```

**✅ Solution:**
```bash
npm install uuid @nestjs/serve-static --save-dev @types/multer
```

### ❌ Error Set 2: Multer Type Issues

**Error Messages:**
```
Namespace 'global.Express' has no exported member 'Multer'
Cannot find module 'multer' or its type declarations
```

**✅ Solution:**

تمام files میں import fix کیا:

```typescript
// ❌ غلط
import type { Multer } from 'multer';
import type { File as MulterFile } from 'multer';

// ✅ صحیح
import type { Express } from 'express';

// استعمال
file: Express.Multer.File
```

**Files fixed:**
- `src/infrastructure/storage/storage.types.ts`
- `src/infrastructure/storage/local-storage.provider.ts`
- `src/infrastructure/storage/cloud-storage.provider.ts`
- `src/infrastructure/storage/storage.service.ts`
- `src/upload/upload.controller.ts`

### ❌ Error Set 3: Frontend Import Issue

**Error Message:**
```
Module '"./client"' has no exported member 'apiClient'
```

**✅ Solution:**

`frontend/src/lib/api/client.ts` میں:

```typescript
export default apiClient;
export { apiClient };  // ← یہ line add کی
```

---

## Testing

### Manual Testing - Backend

**Event Poster Upload:**
```bash
curl -X POST http://localhost:3000/api/v1/upload/event-poster \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/poster.jpg"
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "url": "http://localhost:3000/uploads/events/123e4567-e89b-12d3-a456-426614174000.jpg",
  "filename": "123e4567-e89b-12d3-a456-426614174000.jpg",
  "originalName": "poster.jpg",
  "size": 2048576
}
```

**Delete File:**
```bash
curl -X DELETE http://localhost:3000/api/v1/upload/events/filename.jpg \
  -H "Authorization: Bearer $TOKEN"
```

### Frontend Testing

**Event Create Form:**
```typescript
// 1. File select
const file = /* user selected file */;

// 2. Upload via hook
uploadPoster(file, {
  onSuccess: (data) => {
    console.log('Uploaded:', data.url);
    // Save to database with this URL
  },
});

// 3. Response کا URL database میں save کریں
```

---

## Production Migration

### Step 1: AWS S3 Setup

```env
STORAGE_TYPE=s3
AWS_S3_BUCKET=my-bucket
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY_ID=xxxxx
AWS_S3_SECRET_ACCESS_KEY=xxxxx
```

### Step 2: Implement Cloud Provider

**Update**: `src/infrastructure/storage/cloud-storage.provider.ts`

```typescript
import AWS from 'aws-sdk';

@Injectable()
export class CloudStorageProvider implements StorageProvider {
  private s3: AWS.S3;
  
  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: configService.get('AWS_S3_ACCESS_KEY_ID'),
      secretAccessKey: configService.get('AWS_S3_SECRET_ACCESS_KEY'),
    });
  }
  
  async upload(file: Express.Multer.File, options: StorageUploadOptions): Promise<StoredFile> {
    const filename = `${uuid()}${path.extname(file.originalname)}`;
    const key = `${options.category}/${filename}`;
    
    const params = {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    
    const result = await this.s3.upload(params).promise();
    
    return {
      id: uuid(),
      originalName: file.originalname,
      filename,
      url: result.Location,
      path: key,
      size: file.size,
      mimetype: file.mimetype,
      category: options.category,
      uploadedAt: new Date(),
    };
  }
}
```

### Step 3: Migrate Existing Files

```bash
# Create migration script
npm run migrate:files:to-cloud

# Script should:
# 1. Read files from /uploads/
# 2. Upload to S3
# 3. Update database URLs
# 4. Delete local copies
```

### Step 4: Switch Provider (Automatic)

```typescript
// StorageService میں automatic:
const storageType = configService.get('STORAGE_TYPE');

if (storageType === 'local') {
  this.provider = localStorageProvider;
} else {
  this.provider = cloudStorageProvider;
}
```

**بس!** Local سے Cloud میں switch ہوگیا۔

---

## File Size Limits by Category

| Category | Size | Extensions |
|----------|------|-----------|
| EVENT_POSTER | 50MB | JPG, PNG, WebP, GIF |
| USER_AVATAR | 10MB | JPG, PNG, WebP |
| TEAM_MEMBER | 10MB | JPG, PNG, WebP |
| SPONSOR_LOGO | 5MB | JPG, PNG, WebP, SVG |
| DOCUMENT | 50MB | PDF, Word, Excel |
| ATTACHMENT | 50MB | PDF, ZIP, Images |

---

## Security Features

### ✅ Authentication
```typescript
@UseGuards(JwtAuthGuard)  // تمام endpoints میں
```

### ✅ File Validation
- MIME type checking
- Size limits per category
- UUID-based filenames (no path traversal)

### ✅ Directory Organization
```
uploads/
├── events/          # صرف images
├── users/           # صرف avatars
├── content/
│   ├── team/        # صرف team photos
│   └── sponsors/    # صرف logos
```

### ✅ .gitignore Setup
```
/backend/uploads/
!/backend/uploads/.gitkeep
```

---

## Troubleshooting

### مسئلہ: Files نہیں دکھ رہی ہیں

```bash
# Check directory exists
ls -la backend/uploads/

# Check permissions
chmod 755 backend/uploads
chmod 755 backend/uploads/*

# Verify URL
echo "http://localhost:3000/uploads/events/test.jpg"
```

### مسئلہ: Upload fail ہو رہا ہے

```bash
# Check JWT token valid ہے
# Check file size < limit
# Check disk space: df -h
# Check server logs
```

### مسئلہ: Cloud upload میں error

```bash
# Verify S3 credentials
# Check bucket exists
# Check IAM permissions
# Check bucket CORS configuration
```

---

## تخلاصہ

### ✅ کیا مکمل ہوا:

1. **Backend Storage System**
   - Local provider (development)
   - Cloud provider skeleton (production)
   - Type-safe abstractions
   - 5 upload endpoints

2. **Frontend Integration**
   - Upload API functions
   - React Query hooks
   - Error handling
   - Loading states

3. **Security**
   - JWT authentication
   - File validation
   - MIME type checking
   - Path traversal prevention

4. **Error Fixes**
   - ✅ Multer types fixed
   - ✅ Dependencies installed
   - ✅ Frontend imports fixed
   - ✅ Build successful

### 📝 اگلے Steps:

1. Components میں hooks استعمال کریں
2. Database میں URL save کریں
3. Production میں S3 setup کریں
4. Tests لکھیں

---

**تیار ہے! اب فائل uploads ہو سکتی ہیں!** 🚀
