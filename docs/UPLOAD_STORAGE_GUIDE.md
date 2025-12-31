# File Upload & Storage System

## Overview

The system supports flexible file storage with seamless migration from local storage (development) to cloud storage (production).

## Architecture

### Storage Layer

```
src/infrastructure/storage/
├── storage.types.ts          # Types and interfaces
├── storage.service.ts        # Main service (abstraction)
├── local-storage.provider.ts # Local file system provider
└── cloud-storage.provider.ts # Cloud storage provider (AWS S3, Azure, GCS)
```

### File Categories

Files are organized by category for better management:

- **EVENT_POSTER**: Event images (`uploads/events/`)
- **USER_AVATAR**: User profile pictures (`uploads/users/`)
- **TEAM_MEMBER**: Team member photos (`uploads/content/team/`)
- **SPONSOR_LOGO**: Sponsor logos (`uploads/content/sponsors/`)
- **DOCUMENT**: PDFs and office documents
- **ATTACHMENT**: Various file attachments

## Development Setup

### Local Storage (Default)

By default, the system uses local file storage:

```env
STORAGE_TYPE=local
APP_URL=http://localhost:3000
```

Files are stored in `/backend/uploads/` directory:

```
uploads/
├── events/          # Event posters
├── users/           # User avatars
└── content/
    ├── team/        # Team member photos
    └── sponsors/    # Sponsor logos
```

### Upload Endpoints

#### 1. Upload Event Poster

```bash
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

#### 2. Upload User Avatar

```bash
POST /api/v1/upload/user-avatar
Content-Type: multipart/form-data

file: <binary image file>

Response:
{
  "id": "uuid",
  "url": "http://localhost:3000/uploads/users/filename.jpg",
  "filename": "filename.jpg"
}
```

#### 3. Upload Team Member Photo

```bash
POST /api/v1/upload/team-member
Content-Type: multipart/form-data

file: <binary image file>

Response:
{
  "id": "uuid",
  "url": "http://localhost:3000/uploads/content/team/filename.jpg",
  "filename": "filename.jpg"
}
```

#### 4. Upload Sponsor Logo

```bash
POST /api/v1/upload/sponsor-logo
Content-Type: multipart/form-data

file: <binary image file>

Response:
{
  "id": "uuid",
  "url": "http://localhost:3000/uploads/content/sponsors/filename.svg",
  "filename": "filename.svg"
}
```

#### 5. Delete File

```bash
DELETE /api/v1/upload/events/filename.jpg

Response:
{
  "success": true
}
```

## Frontend Usage

### Upload Hooks

```typescript
import { useUploadEventPoster } from '@/hooks/use-upload';

function EventForm() {
  const { mutate: uploadPoster, isPending } = useUploadEventPoster();

  const handleFileSelect = async (file: File) => {
    uploadPoster(file, {
      onSuccess: (data) => {
        console.log('Uploaded:', data.url);
        // Save URL to database
      },
      onError: (error) => {
        console.error('Upload failed:', error);
      },
    });
  };

  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => handleFileSelect(e.target.files?.[0]!)}
      disabled={isPending}
    />
  );
}
```

### Available Hooks

- `useUploadEventPoster()` - For event posters
- `useUploadUserAvatar()` - For user avatars
- `useUploadTeamMember()` - For team photos
- `useUploadSponsorLogo()` - For sponsor logos
- `useDeleteUploadedFile()` - For deleting files

## File Size & Type Validation

### By Category

| Category | Max Size | Allowed Types |
|----------|----------|--------------|
| EVENT_POSTER | 50MB | JPG, PNG, WebP, GIF |
| USER_AVATAR | 10MB | JPG, PNG, WebP |
| TEAM_MEMBER | 10MB | JPG, PNG, WebP |
| SPONSOR_LOGO | 5MB | JPG, PNG, WebP, SVG |
| DOCUMENT | 50MB | PDF, Word, Excel |
| ATTACHMENT | 50MB | PDF, Images, ZIP, RAR |

### Client-Side Validation

```typescript
const { mutate: uploadAvatar } = useUploadUserAvatar();

const handleUpload = (file: File) => {
  // Automatically validates:
  // - File size max 10MB
  // - Format: JPG, PNG, WebP
  uploadAvatar(file);
};
```

## Production Migration to Cloud Storage

### Step 1: Choose Storage Provider

Update `.env`:

```env
STORAGE_TYPE=s3  # or 'azure', 'gcs'
```

### Step 2: Configure Provider

#### AWS S3

```env
STORAGE_TYPE=s3
AWS_S3_BUCKET=my-bucket
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY_ID=xxxxx
AWS_S3_SECRET_ACCESS_KEY=xxxxx
```

Implement S3 provider in `cloud-storage.provider.ts`:

```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
});

async upload(file, options) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${options.category}/${filename}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  
  const result = await s3.upload(params).promise();
  return { url: result.Location, ... };
}
```

#### Azure Blob Storage

```env
STORAGE_TYPE=azure
AZURE_STORAGE_ACCOUNT=myaccount
AZURE_STORAGE_ACCOUNT_KEY=xxxxx
AZURE_STORAGE_CONTAINER=my-container
```

Implement Azure provider similarly.

### Step 3: Migrate Existing Files

Create migration script:

```bash
npm run migrate:files:to-cloud
```

This script:
1. Reads all files from `/uploads/`
2. Uploads to cloud storage
3. Updates database URLs
4. Archives local copies

### Step 4: Switch Provider at Runtime

The system automatically uses the configured provider:

```typescript
// In StorageService
const storageType = configService.get('STORAGE_TYPE');
if (storageType === 'local') {
  this.provider = localStorageProvider;
} else {
  this.provider = cloudStorageProvider;
}
```

## Database Integration

### Storing File URLs

When uploading files, save the returned URL in your database:

```typescript
// Example: Update event with poster
const posterData = await uploadEventPoster(file);

await updateEvent(eventId, {
  posterUrl: posterData.url,
  posterPath: posterData.path,
});
```

### File References

Keep track of file references:

```typescript
interface EventPoster {
  url: string;        // Public URL (http://...)
  path: string;       // Storage path (events/uuid.jpg)
  size: number;       // File size in bytes
  uploadedAt: Date;   // Upload timestamp
}
```

## Security Considerations

### Authentication

All upload endpoints require JWT authentication:

```typescript
@UseGuards(JwtAuthGuard)
async uploadEventPoster(@UploadedFile() file: Express.Multer.File)
```

### File Type Validation

- Strict MIME type checking (no user input accepted)
- File extension validation
- Magic number verification (future enhancement)

### File Size Limits

- Enforced per category
- Prevents storage bloat
- Protects against abuse

### Path Traversal Prevention

- Files stored in designated directories only
- No user-controlled path components
- UUID-based filenames

## Monitoring & Maintenance

### Check Storage Usage

```bash
# Local storage
du -sh backend/uploads/

# Get file count by category
find backend/uploads -type f | wc -l
```

### Cleanup Old Files

```bash
# Find files older than 90 days
find backend/uploads -type f -mtime +90

# Delete old uploads (careful!)
find backend/uploads -type f -mtime +90 -delete
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "No file provided" | Upload endpoint called without file | Check form submission |
| "File size exceeds limit" | File too large | Compress before upload |
| "Invalid file type" | Wrong MIME type | Check accepted formats |
| "Directory not created" | Permissions issue | Check /uploads folder permissions |

## Testing

### Manual Testing

```bash
# Upload a file
curl -X POST http://localhost:3000/api/v1/upload/event-poster \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@poster.jpg"

# Delete file
curl -X DELETE http://localhost:3000/api/v1/upload/events/filename.jpg \
  -H "Authorization: Bearer $TOKEN"
```

### Automated Tests

```typescript
describe('Upload API', () => {
  it('should upload event poster', async () => {
    const file = /* test file */;
    const response = await uploadEventPoster(file);
    
    expect(response.url).toBeDefined();
    expect(response.size).toBe(file.size);
  });
});
```

## Environment Variables

See `.env.storage` for all configuration options.

### Required Variables

- `STORAGE_TYPE` - Storage provider type
- `APP_URL` - Base URL for public file access

### Provider-Specific

- **Local**: None (directory created automatically)
- **S3**: AWS credentials and bucket name
- **Azure**: Storage account credentials
- **GCS**: Project ID and service account key

## Troubleshooting

### Files Not Showing

1. Check `/uploads` directory exists
2. Verify permissions: `chmod 755 backend/uploads`
3. Check file URL is correct
4. Verify CORS headers (if accessing from different origin)

### Upload Fails

1. Check file size < limit
2. Verify JWT token is valid
3. Check disk space available
4. Review server logs for details

### Cloud Upload Issues

1. Verify credentials in `.env`
2. Check bucket permissions
3. Verify bucket exists
4. Check IAM policies

## References

- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Azure Blob Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- [Google Cloud Storage](https://cloud.google.com/storage/docs)
