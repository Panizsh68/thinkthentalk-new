# چک‌لیست کامل بررسی بک‌اند و تعامل با دیتابیس

این فایل شامل چک‌لیست کامل برای بررسی اینکه تمام عملیات در بک‌اند به درستی انجام می‌شود و با دیتابیس به درستی تعامل می‌کند.

## 📋 فهرست مطالب
1. [تنظیمات پایه و Infrastructure](#تنظیمات-پایه-و-infrastructure)
2. [Database Connection & Prisma](#database-connection--prisma)
3. [Authentication & Authorization](#authentication--authorization-1)
4. [User Management](#user-management-1)
5. [Events Management](#events-management-1)
6. [Registrations & Payments](#registrations--payments-1)
7. [Discounts](#discounts-1)
8. [Content Management](#content-management)
9. [Feedback/Evaluation](#feedbackevaluation-1)
10. [Admin Features](#admin-features-1)
11. [Messaging](#messaging-1)
12. [Security & Performance](#security--performance)

---

## تنظیمات پایه و Infrastructure

### ✅ Database Connection
- [x] Prisma Client به درستی generate شده است (`npx prisma generate`)
- [x] Database connection string در `.env` تنظیم شده است
- [x] Connection pool به درستی configure شده است
- [x] Database migrations اجرا شده است (`npx prisma migrate dev`)
- [ ] Seed data (اگر وجود دارد) اجرا شده است (`npx prisma db seed`)

### ✅ Environment Variables
- [x] `DATABASE_URL` تنظیم شده است
- [x] `JWT_SECRET` تنظیم شده است
- [x] `JWT_EXPIRES_IN` تنظیم شده است
- [x] `CORS_ORIGINS` تنظیم شده است
- [x] `PORT` تنظیم شده است (default: 3000)
- [x] `THROTTLE_TTL` و `THROTTLE_LIMIT` تنظیم شده‌اند
- [x] تنظیمات IPPanel (`IPPANEL_BASE_URL`، `IPPANEL_API_KEY`، `IPPANEL_FROM_NUMBER` و `IPPANEL_OTP_PATTERN_CODE`) برای ارسال پیامک در `.env.production` درج شده‌اند.

### ✅ Prisma Schema
- [x] تمام models در schema تعریف شده‌اند
- [x] Relations بین models به درستی تعریف شده‌اند
- [x] Indexes برای performance اضافه شده‌اند
- [x] Enums به درستی تعریف شده‌اند
- [x] Default values برای fields مناسب تنظیم شده‌اند

---

## Authentication & Authorization

### ✅ OTP Authentication
- [x] `POST /api/v1/auth/request-otp`:
  - [x] Mobile number validation انجام می‌شود
  - [x] OTP generate و در database ذخیره می‌شود
  - [x] Rate limiting اعمال می‌شود (429)
  - [x] SMS از طریق IPPanel ارسال می‌شود (الگوی `otp` با fallback متنی در صورت خطای 422)
  - [x] OTP expiration time رعایت می‌شود

- [x] `POST /api/v1/auth/verify-otp`:
  - [x] OTP validation انجام می‌شود
  - [x] User ایجاد یا update می‌شود در database
  - [x] JWT token generate می‌شود
  - [x] Token در response header ارسال می‌شود
  - [x] Rate limiting اعمال می‌شود

### ✅ Admin Authentication
- [x] `POST /api/v1/auth/admin/login`:
  - [x] Email و password validation انجام می‌شود
  - [x] Password hash با bcrypt مقایسه می‌شود
  - [x] AdminUser از database fetch می‌شود
  - [x] JWT token generate می‌شود
  - [x] Token در response header ارسال می‌شود
  - [x] Rate limiting اعمال می‌شود

### ✅ JWT Guards
- [x] `JwtAuthGuard` به درستی کار می‌کند
- [x] Token validation انجام می‌شود
- [x] User/Admin از token extract می‌شود
- [x] `@CurrentUser()` decorator به درستی کار می‌کند

### ✅ Role-Based Access Control
- [x] `RolesGuard` به درستی کار می‌کند
- [x] `@Roles()` decorator اعمال می‌شود
- [x] Admin roles (ADMIN, EVENT_MANAGER, FINANCE) بررسی می‌شوند

---

## User Management

### ✅ Get User Profile
- [x] `GET /api/v1/users/me`:
  - [x] User از database fetch می‌شود با Prisma
  - [x] فقط user خودش می‌تواند profile خودش را ببیند
  - [x] Response به `UserDto` map می‌شود
  - [x] 401 اگر authenticated نیست

### ✅ Update User Profile
- [x] `PATCH /api/v1/users/me`:
  - [x] Validation با DTO انجام می‌شود
  - [x] Update در database با Prisma انجام می‌شود
  - [x] فقط user خودش می‌تواند profile خودش را update کند
  - [x] Response به `UserDto` map می‌شود
  - [x] 400 برای validation errors
  - [x] 401 اگر authenticated نیست

---

## Events Management

### ✅ Public Events List
- [x] `GET /api/v1/events`:
  - [x] Events از database fetch می‌شوند با Prisma
  - [x] Filters اعمال می‌شوند:
    - [x] `showPastEvents` filter
    - [x] `type` filter (ONLINE/OFFLINE)
    - [x] `city` filter
    - [x] `category` filter
    - [x] `categories[]` array filter
    - [x] `dateRange[from]` و `dateRange[to]` filters
  - [x] Relations (tickets, resources) load می‌شوند
  - [x] Response به `EventDto[]` map می‌شود
  - [x] Cache (Redis) استفاده می‌شود (اگر configure شده)

### ✅ Get Event Details
- [x] `GET /api/v1/events/{eventId}`:
  - [x] Event از database fetch می‌شود با Prisma
  - [x] Relations (tickets, resources, discounts) load می‌شوند
  - [x] 404 اگر event پیدا نشود
  - [x] Response به `EventDto` map می‌شود
  - [x] Cache استفاده می‌شود

### ✅ Admin - List All Events
- [x] `GET /api/v1/admin/events`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Events از database fetch می‌شوند (شامل past events)
  - [x] Pagination اعمال می‌شود (page, limit)
  - [x] Sorting اعمال می‌شود (sortBy, sortOrder)
  - [x] 401 اگر authenticated نیست
  - [x] 403 اگر role مناسب ندارد

### ✅ Admin - Create Event
- [x] `POST /api/v1/admin/events`:
  - [x] Validation با `EventFormDataDto` انجام می‌شود
  - [x] Event در database ایجاد می‌شود با Prisma
  - [ ] Ticket configs ایجاد می‌شوند (در مرحله جداگانه انجام می‌شود)
  - [ ] Resources ایجاد می‌شوند (در مرحله جداگانه انجام می‌شود)
  - [x] Audit log ثبت می‌شود
  - [x] Cache invalidate می‌شود
  - [x] 201 برای success
  - [x] 400 برای validation errors
  - [x] 401/403 برای auth errors

### ✅ Admin - Get Event for Edit
- [x] `GET /api/v1/admin/events/{eventId}`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Event از database fetch می‌شود
  - [x] تمام relations load می‌شوند
  - [x] 404 اگر event پیدا نشود
  - [x] 401/403 برای auth errors

### ✅ Admin - Update Event
- [x] `PATCH /api/v1/admin/events/{eventId}`:
  - [x] Validation با `UpdateEventFormDataDto` انجام می‌شود
  - [x] Partial update در database انجام می‌شود
  - [x] Audit log ثبت می‌شود
  - [x] Cache invalidate می‌شود
  - [x] 404 اگر event پیدا نشود
  - [x] 400 برای validation errors
  - [x] 401/403 برای auth errors

### ✅ Admin - Update Event Tickets
- [x] `PATCH /api/v1/admin/events/{eventId}/tickets`:
  - [x] Validation با `EventTicketConfigDto[]` انجام می‌شود
  - [x] Old tickets حذف می‌شوند
  - [x] New tickets ایجاد می‌شوند
  - [x] Transaction استفاده می‌شود برای atomicity
  - [x] Audit log ثبت می‌شود
  - [x] Cache invalidate می‌شود
  - [x] 404 اگر event پیدا نشود
  - [x] 400 برای validation errors

### ✅ Admin - Update Event Resources
- [x] `PATCH /api/v1/admin/events/{eventId}/resources`:
  - [x] Validation با `EventResourceDto[]` انجام می‌شود
  - [x] Old resources حذف می‌شوند
  - [x] New resources ایجاد می‌شوند
  - [x] Transaction استفاده می‌شود
  - [x] Audit log ثبت می‌شود
  - [x] Cache invalidate می‌شود
  - [x] 404 اگر event پیدا نشود
  - [x] 400 برای validation errors

---

## Registrations & Payments

### ✅ Get User Registrations
- [x] `GET /api/v1/registrations/me`:
  - [x] User از token extract می‌شود
  - [x] Registrations از database fetch می‌شوند با `userId`
  - [x] Relations (event, payment) load می‌شوند
  - [x] Response به `UserRegistrationDto[]` map می‌شود
  - [x] 401 اگر authenticated نیست

### ✅ Create Registration and Payment
- [x] `POST /api/v1/payments`:
  - [x] Validation با `CreatePaymentBodyDto` انجام می‌شود
  - [x] Event capacity بررسی می‌شود
  - [x] Registration در database ایجاد می‌شود
  - [x] Payment در database ایجاد می‌شود
  - [x] Transaction استفاده می‌شود برای atomicity
  - [x] Event capacity decrement می‌شود
  - [x] Ticket quantity decrement می‌شود
  - [x] Response به `PaymentDto` map می‌شود
  - [x] 400 برای validation errors یا capacity full
  - [x] 401 اگر authenticated نیست

### ✅ Get Payment Details
- [x] `GET /api/v1/payments/{paymentId}`:
  - [x] Payment از database fetch می‌شود
  - [x] Ownership بررسی می‌شود (user خودش)
  - [x] Relations load می‌شوند
  - [x] 404 اگر payment پیدا نشود
  - [x] 401 اگر authenticated نیست

### ✅ Verify Payment Status
- [x] `POST /api/v1/payments/{paymentId}`:
  - [x] Validation با `VerifyPaymentStatusDto` انجام می‌شود
  - [x] Payment از database fetch می‌شود
  - [x] Ownership بررسی می‌شود
  - [x] Payment status update می‌شود
  - [x] Registration status update می‌شود (اگر SUCCESS)
  - [x] Transaction استفاده می‌شود
  - [x] 404 اگر payment پیدا نشود
  - [x] 400 برای validation errors
  - [x] 401 اگر authenticated نیست

### ✅ Admin - List All Registrations
- [x] `GET /api/v1/admin/registrations`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Registrations از database fetch می‌شوند
  - [x] Relations (user, event, payment) load می‌شوند
  - [x] Pagination اعمال می‌شود
  - [x] Response به `UserRegistrationDetailsDto[]` map می‌شود
  - [x] 401/403 برای auth errors

### ✅ Admin - Get Registration Details
- [x] `GET /api/v1/admin/registrations/{registrationId}`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Registration از database fetch می‌شود
  - [x] تمام relations load می‌شوند
  - [x] 404 اگر registration پیدا نشود
  - [x] 401/403 برای auth errors

### ✅ Admin - Update Registration
- [x] `PATCH /api/v1/admin/registrations/{registrationId}`:
  - [x] Validation انجام می‌شود
  - [x] Partial update در database انجام می‌شود
  - [x] Payment status هم update می‌شود (اگر لازم باشد)
  - [x] Transaction استفاده می‌شود
  - [x] 404 اگر registration پیدا نشود
  - [x] 400 برای validation errors
  - [x] 401/403 برای auth errors

### ✅ Admin - List All Payments
- [x] `GET /api/v1/admin/payments`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Payments از database fetch می‌شوند
  - [x] Filters اعمال می‌شوند (eventId, status)
  - [x] Relations load می‌شوند
  - [x] Response به `PaymentDto[]` map می‌شود
  - [x] 401/403 برای auth errors

---

## Discounts

### ✅ Validate Discount Code
- [x] `POST /api/v1/discounts/validate`:
  - [x] Validation با `ValidateDiscountDto` انجام می‌شود
  - [x] Discount از database fetch می‌شود با code
  - [x] بررسی می‌شود:
    - [x] `isActive` = true
    - [x] `startDate` <= now <= `endDate`
    - [x] `usedCount` < `maxUses` (اگر set شده)
    - [x] `applicableEventIds` شامل eventId است (اگر set شده)
    - [x] `ticketPrice` >= `minAmount` (اگر set شده)
  - [x] Response به `DiscountDto` map می‌شود
  - [x] 400 برای invalid discount
  - [x] 401 اگر authenticated نیست

### ✅ Admin - List Discounts
- [x] `GET /api/v1/admin/discounts`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Discounts از database fetch می‌شوند
  - [x] Relations (events) load می‌شوند
  - [x] Response به `DiscountDto[]` map می‌شود
  - [x] 401/403 برای auth errors

### ✅ Admin - Create Discount
- [x] `POST /api/v1/admin/discounts`:
  - [x] Validation با `DiscountFormDataDto` انجام می‌شود
  - [x] Discount در database ایجاد می‌شود
  - [x] Relations با events ایجاد می‌شوند (اگر applicableEventIds set شده)
  - [x] Transaction استفاده می‌شود
  - [x] 201 برای success
  - [x] 400 برای validation errors
  - [x] 401/403 برای auth errors

### ✅ Admin - Update Discount
- [x] `PATCH /api/v1/admin/discounts/{discountId}`:
  - [x] Validation با `DiscountFormDataDto` انجام می‌شود
  - [x] Partial update در database انجام می‌شود
  - [x] Relations با events update می‌شوند
  - [x] Transaction استفاده می‌شود
  - [x] 404 اگر discount پیدا نشود
  - [x] 400 برای validation errors
  - [x] 401/403 برای auth errors

### ✅ Admin - Delete Discount
- [x] `DELETE /api/v1/admin/discounts/{discountId}`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Discount از database حذف می‌شود
  - [x] Relations (DiscountOnEvent) cascade delete می‌شوند
  - [x] 204 برای success
  - [x] 404 اگر discount پیدا نشود
  - [x] 401/403 برای auth errors

---

## Content Management

### ✅ Public - List Sponsors
- [x] `GET /api/v1/sponsors`:
  - [x] Sponsors از database fetch می‌شوند
  - [x] Response به `SponsorDto[]` map می‌شود

### ✅ Admin - List All Sponsors
- [x] `GET /api/v1/admin/sponsors`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Sponsors از database fetch می‌شوند
  - [x] Response به `SponsorDto[]` map می‌شود
  - [x] 401/403 برای auth errors

### ✅ Admin - Create Sponsor
- [x] `POST /api/v1/admin/sponsors`:
  - [x] Validation با `SponsorFormDataDto` انجام می‌شود
  - [x] Sponsor در database ایجاد می‌شود
  - [x] 201 برای success
  - [x] 400 برای validation errors
  - [x] 401/403 برای auth errors

### ✅ Admin - Update Sponsor
- [x] `PATCH /api/v1/admin/sponsors/{sponsorId}`:
  - [x] Validation با `SponsorFormDataDto` انجام می‌شود
  - [x] Update در database انجام می‌شود
  - [x] 404 اگر sponsor پیدا نشود
  - [x] 400 برای validation errors
  - [x] 401/403 برای auth errors

### ✅ Admin - Delete Sponsor
- [x] `DELETE /api/v1/admin/sponsors/{sponsorId}`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Sponsor از database حذف می‌شود
  - [x] 204 برای success
  - [x] 404 اگر sponsor پیدا نشود
  - [x] 401/403 برای auth errors

### ✅ Public - List Team Members
- [x] `GET /api/v1/team`:
  - [x] Team members از database fetch می‌شوند
  - [x] Response به `TeamMemberDto[]` map می‌شود

### ✅ Admin - List All Team Members
- [x] `GET /api/v1/admin/team`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Team members از database fetch می‌شوند
  - [x] Response به `TeamMemberDto[]` map می‌شود
  - [x] 401/403 برای auth errors

### ✅ Admin - Create Team Member
- [x] `POST /api/v1/admin/team`:
  - [x] Validation با `TeamMemberFormDataDto` انجام می‌شود
  - [x] Team member در database ایجاد می‌شود
  - [x] 201 برای success
  - [x] 400 برای validation errors
  - [x] 401/403 برای auth errors

### ✅ Admin - Update Team Member
- [x] `PATCH /api/v1/admin/team/{memberId}`:
  - [x] Validation با `TeamMemberFormDataDto` انجام می‌شود
  - [x] Update در database انجام می‌شود
  - [x] 404 اگر team member پیدا نشود
  - [x] 400 برای validation errors
  - [x] 401/403 برای auth errors

### ✅ Admin - Delete Team Member
- [x] `DELETE /api/v1/admin/team/{memberId}`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Team member از database حذف می‌شود
  - [x] 204 برای success
  - [x] 404 اگر team member پیدا نشود
  - [x] 401/403 برای auth errors

---

## Feedback/Evaluation

### ✅ Get Evaluation Form
- [x] `GET /api/v1/events/{eventId}/evaluation`:
  - [x] Authentication بررسی می‌شود
  - [x] Event از database fetch می‌شود
  - [x] EvaluationForm از database fetch می‌شود
  - [x] Questions load می‌شوند
  - [x] بررسی می‌شود که user در event ثبت‌نام کرده و paid است
  - [x] بررسی می‌شود که user قبلاً submit نکرده است
  - [x] Response به `EvaluationFormDto` map می‌شود
  - [x] 403 اگر user eligible نیست
  - [x] 404 اگر event یا form پیدا نشود
  - [x] 401 اگر authenticated نیست

### ✅ Submit Evaluation
- [x] `POST /api/v1/evaluations/{evaluationId}/submit`:
  - [x] Validation با answers انجام می‌شود
  - [x] EvaluationForm از database fetch می‌شود
  - [x] بررسی می‌شود که user قبلاً submit نکرده است
  - [x] EvaluationSubmission در database ایجاد می‌شود
  - [x] Transaction استفاده می‌شود
  - [x] 400 برای validation errors یا already submitted
  - [x] 401 اگر authenticated نیست

### ✅ Admin - Save Evaluation Form
- [x] `PATCH /api/v1/admin/events/{eventId}/evaluation`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Event از database fetch می‌شود
  - [x] EvaluationForm ایجاد یا update می‌شود
  - [x] Old questions حذف می‌شوند
  - [x] New questions ایجاد می‌شوند
  - [x] Transaction استفاده می‌شود
  - [x] 404 اگر event پیدا نشود
  - [x] 400 برای validation errors
  - [x] 401/403 برای auth errors

### ✅ Admin - Get Evaluation Responses
- [x] `GET /api/v1/admin/events/{eventId}/evaluation/responses`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Event از database fetch می‌شود
  - [x] EvaluationForm از database fetch می‌شود
  - [x] EvaluationSubmissions از database fetch می‌شوند
  - [x] Relations (user) load می‌شوند
  - [x] Response به `EvaluationResponseDto[]` map می‌شود
  - [x] 404 اگر event پیدا نشود
  - [x] 401/403 برای auth errors

---

## Admin Features

### ✅ Admin Dashboard Stats
- [x] `GET /api/v1/admin/stats`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] آمار از database محاسبه می‌شود:
    - [x] `upcomingEvents`: count events با startDateTime > now
    - [x] `totalRegistrations`: count all registrations
    - [x] `paidRegistrations`: count registrations با status = PAID
    - [x] `totalRevenue`: sum payments با status = SUCCESS
  - [x] Response به `AdminStatsDto` map می‌شود
  - [x] 401/403 برای auth errors

---

## Messaging

### ✅ Admin - Send Bulk Message
- [x] `POST /api/v1/admin/messaging/send`:
  - [x] Authentication و authorization بررسی می‌شود
  - [x] Validation انجام می‌شود
  - [x] Registrations از database fetch می‌شوند
  - [x] User data از registrations extract می‌شود
  - [x] Messages به queue اضافه می‌شوند (یا مستقیماً ارسال می‌شوند)
  - [x] SMS/Email ارسال می‌شود (یا mock شده)
  - [x] 400 برای validation errors
  - [x] 401/403 برای auth errors

---

## Security & Performance

### ✅ Security
- [x] CORS به درستی configure شده است
- [x] Helmet middleware فعال است
- [x] Rate limiting اعمال می‌شود
- [x] Input validation با DTOs انجام می‌شود
- [x] SQL injection prevention (Prisma)
- [x] XSS prevention
- [x] JWT tokens به درستی validate می‌شوند
- [x] Password hashing با bcrypt انجام می‌شود
- [x] Sensitive data در logs لاگ نمی‌شود

### ✅ Performance
- [x] Database indexes برای queries مهم اضافه شده‌اند
- [x] Prisma queries بهینه هستند (select فقط fields لازم)
- [x] Relations به درستی load می‌شوند (include)
- [x] Cache (Redis) برای queries پرتکرار استفاده می‌شود
- [x] Pagination برای list endpoints اعمال می‌شود
- [x] Database connection pool بهینه است

### ✅ Error Handling
- [x] Global exception filter فعال است
- [x] Error responses به format یکسان هستند
- [x] Sensitive error messages به client ارسال نمی‌شوند
- [x] Logging برای errors انجام می‌شود

### ✅ Data Integrity
- [x] Transactions برای عملیات atomic استفاده می‌شوند
- [x/partial] Foreign key constraints در Prisma schema تعریف شده‌اند
- [x/partial] Cascade deletes به درستی configure شده‌اند
- [x] Unique constraints اعمال شده‌اند (mobile, email, code)

### ✅ Testing
- [ ] Unit tests برای services نوشته شده‌اند
- [ ] Integration tests برای controllers نوشته شده‌اند
- [ ] Database tests با test database انجام می‌شوند
- [ ] E2E tests برای critical flows نوشته شده‌اند

---

## نکات مهم

### Database Queries
- استفاده از Prisma transactions برای عملیات atomic
- استفاده از `include` برای load کردن relations
- استفاده از `select` برای انتخاب فقط fields لازم
- استفاده از indexes برای بهبود performance

### Error Responses
- همه errors باید به format `{ message: string }` باشند
- Status codes باید صحیح باشند (400, 401, 403, 404, 500)
- Error messages نباید sensitive information داشته باشند

### Validation
- همه inputs باید با DTOs validate شوند
- ValidationPipe در main.ts فعال است
- Custom validators برای business logic

### Logging
- Logging برای important operations
- Audit logs برای admin actions
- Error logging برای debugging
