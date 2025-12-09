# لیست کامل تسک‌های اتصال فرانت‌اند به بک‌اند

این فایل شامل تمام تسک‌های لازم برای اتصال کامل فرانت‌اند به بک‌اند و دیتابیس است.

## 📋 فهرست مطالب
1. [تنظیمات پایه](#تنظیمات-پایه)
2. [Authentication & Authorization](#authentication--authorization)
3. [User Management](#user-management)
4. [Events Management](#events-management)
5. [Registrations & Payments](#registrations--payments)
6. [Discounts](#discounts)
7. [Content Management (Sponsors & Team)](#content-management-sponsors--team)
8. [Feedback/Evaluation](#feedbackevaluation)
9. [Admin Features](#admin-features)
10. [Messaging](#messaging)

---

## تنظیمات پایه

### ✅ Task 1.1: ایجاد فایل Config برای URL بک‌اند
- [x] ایجاد فایل `frontend/src/lib/config/api.ts`
- [x] تعریف متغیر `NEXT_PUBLIC_API_URL` در `.env.local`
- [x] ایجاد تابع `getApiUrl()` برای دریافت URL بک‌اند
- [x] تنظیم default URL برای development: `http://localhost:3000/api/v1`

### ✅ Task 1.2: ایجاد HTTP Client مشترک
- [x] ایجاد فایل `frontend/src/lib/api/client.ts`
- [x] پیاده‌سازی تابع `apiClient` با استفاده از `fetch`
- [x] اضافه کردن interceptor برای افزودن Authorization header
- [x] مدیریت خطاها و تبدیل به format یکسان
- [x] مدیریت token از localStorage
- [x] اضافه کردن retry logic برای درخواست‌های ناموفق

### ✅ Task 1.3: مدیریت Token و Authentication State
- [x] ذخیره JWT token در localStorage بعد از login
- [x] اضافه کردن token به header همه درخواست‌های authenticated
- [ ] مدیریت refresh token (اگر پیاده‌سازی شده)
- [x] logout و پاک کردن token از localStorage

---

## Authentication & Authorization

### ✅ Task 2.1: User Authentication (OTP)
- [x] اتصال `frontend/src/lib/api/auth.ts` به `POST /api/v1/auth/request-otp`
- [x] اتصال `frontend/src/lib/api/auth.ts` به `POST /api/v1/auth/verify-otp`
- [x] دریافت و ذخیره JWT token از response header
- [x] ذخیره user data در localStorage
- [x] مدیریت خطاهای 400, 401, 429
- [x] به‌روزرسانی `AuthProvider` برای استفاده از API واقعی

### ✅ Task 2.2: Admin Authentication
- [x] اتصال `frontend/src/lib/api/admin-auth.ts` به `POST /api/v1/auth/admin/login`
- [x] دریافت و ذخیره admin JWT token
- [x] ذخیره admin user data
- [x] مدیریت خطاهای authentication
- [x] به‌روزرسانی `AdminAuthProvider` برای استفاده از API واقعی

---

## User Management

### ✅ Task 3.1: Get User Profile
- [x] اتصال `frontend/src/lib/api/user.ts` به `GET /api/v1/users/me`
- [x] اضافه کردن Authorization header
- [x] مدیریت خطای 401 (unauthorized)
- [x] به‌روزرسانی `AuthProvider` برای fetch کردن user profile در mount

### ✅ Task 3.2: Update User Profile
- [x] اتصال `frontend/src/lib/api/user.ts` به `PATCH /api/v1/users/me`
- [x] ارسال partial update data
- [x] مدیریت validation errors (400)
- [x] به‌روزرسانی local state بعد از موفقیت

---

## Events Management

### ✅ Task 4.1: Public Events List
- [x] اتصال `frontend/src/lib/api/events.ts` به `GET /api/v1/events`
- [x] پیاده‌سازی query parameters:
  - [x] `showPastEvents` (boolean)
  - [x] `type` (ONLINE | OFFLINE)
  - [x] `city` (string)
  - [x] `category` (string)
  - [x] `categories[]` (array)
  - [x] `dateRange[from]` (ISO date-time)
  - [x] `dateRange[to]` (ISO date-time)
- [x] تبدیل response به format مورد نیاز frontend
- [ ] مدیریت pagination (اگر اضافه شود)

### ✅ Task 4.2: Get Event Details
- [x] اتصال `frontend/src/lib/api/events.ts` به `GET /api/v1/events/{eventId}`
- [x] مدیریت خطای 404
- [x] تبدیل response format

### ✅ Task 4.3: Admin - List All Events
- [x] اتصال admin events page به `GET /api/v1/admin/events`
- [x] اضافه کردن Authorization header
- [x] پیاده‌سازی query parameters: `page`, `limit`, `sortBy`, `sortOrder`
- [x] مدیریت خطاهای 401, 403

### ✅ Task 4.4: Admin - Create Event
- [x] اتصال admin create event page به `POST /api/v1/admin/events`
- [x] تبدیل form data به `EventFormDataDto` format
- [x] مدیریت validation errors
- [x] redirect بعد از موفقیت

### ✅ Task 4.5: Admin - Get Event for Edit
- [x] اتصال admin edit event page به `GET /api/v1/admin/events/{eventId}`
- [x] populate کردن form با data دریافتی

### ✅ Task 4.6: Admin - Update Event
- [x] اتصال admin edit event page به `PATCH /api/v1/admin/events/{eventId}`
- [x] ارسال partial update data
- [x] مدیریت validation errors

### ✅ Task 4.7: Admin - Update Event Tickets
- [x] اتصال admin tickets page به `PATCH /api/v1/admin/events/{eventId}/tickets`
- [x] ارسال array of `EventTicketConfigDto`
- [x] مدیریت validation errors

### ✅ Task 4.8: Admin - Update Event Resources
- [x] اتصال admin resources page به `PATCH /api/v1/admin/events/{eventId}/resources`
- [x] ارسال array of `EventResourceDto`
- [x] مدیریت validation errors

---

## Registrations & Payments

### ✅ Task 5.1: Get User Registrations
- [x] اتصال `frontend/src/lib/api/registrations.ts` به `GET /api/v1/registrations/me`
- [x] اضافه کردن Authorization header
- [x] تبدیل response format

### ✅ Task 5.2: Create Registration and Payment
- [x] اتصال `frontend/src/lib/api/payments.ts` به `POST /api/v1/payments`
- [x] تبدیل registration wizard data به `CreatePaymentBodyDto`
- [x] مدیریت validation errors
- [x] مدیریت خطای capacity full (400)
- [x] redirect به payment gateway بعد از موفقیت

### ✅ Task 5.3: Get Payment Details
- [x] اتصال `frontend/src/lib/api/payments.ts` به `GET /api/v1/payments/{paymentId}`
- [x] استفاده در payment callback page
- [x] مدیریت خطای 404

### ✅ Task 5.4: Verify Payment Status
- [x] اتصال `frontend/src/lib/api/payments.ts` به `POST /api/v1/payments/{paymentId}`
- [x] ارسال status (SUCCESS | FAILED)
- [x] به‌روزرسانی payment status

### ✅ Task 5.5: Admin - List All Registrations
- [x] اتصال `frontend/src/lib/api/admin-registrations.ts` به `GET /api/v1/admin/registrations`
- [x] پیاده‌سازی pagination (page, limit)
- [x] مدیریت خطاهای 401, 403

### ✅ Task 5.6: Admin - Get Registration Details
- [x] اتصال admin registration detail page به `GET /api/v1/admin/registrations/{registrationId}`
- [x] نمایش تمام اطلاعات registration

### ✅ Task 5.7: Admin - Update Registration
- [x] اتصال admin registration edit به `PATCH /api/v1/admin/registrations/{registrationId}`
- [x] ارسال partial update (status, formData)
- [x] مدیریت validation errors

### ✅ Task 5.8: Admin - List All Payments
- [x] اتصال admin payments page به `GET /api/v1/admin/payments`
- [x] پیاده‌سازی query filters: `eventId`, `status`
- [x] مدیریت خطاهای 401, 403

---

## Discounts

### ✅ Task 6.1: Validate Discount Code
- [x] اتصال `frontend/src/lib/api/discounts.ts` به `POST /api/v1/discounts/validate`
- [x] ارسال: `code`, `eventId`, `ticketPrice`
- [x] مدیریت خطاهای validation (400)
- [x] استفاده در registration wizard

### ✅ Task 6.2: Admin - List Discounts
- [x] اتصال admin discounts page به `GET /api/v1/admin/discounts`
- [x] مدیریت خطاهای 401, 403

### ✅ Task 6.3: Admin - Create Discount
- [x] اتصال admin create discount به `POST /api/v1/admin/discounts`
- [x] تبدیل form data به `DiscountFormDataDto`
- [x] مدیریت validation errors

### ✅ Task 6.4: Admin - Update Discount
- [x] اتصال admin edit discount به `PATCH /api/v1/admin/discounts/{discountId}`
- [x] ارسال partial update
- [x] مدیریت validation errors

### ✅ Task 6.5: Admin - Delete Discount
- [x] اتصال admin delete discount به `DELETE /api/v1/admin/discounts/{discountId}`
- [x] مدیریت خطای 404
- [x] refresh list بعد از حذف

---

## Content Management (Sponsors & Team)

### ✅ Task 7.1: Public - List Sponsors
- [x] اتصال `frontend/src/lib/api/sponsors.ts` به `GET /api/v1/sponsors`
- [x] استفاده در home page

### ✅ Task 7.2: Admin - List All Sponsors
- [x] اتصال admin sponsors page به `GET /api/v1/admin/sponsors`
- [x] مدیریت خطاهای 401, 403

### ✅ Task 7.3: Admin - Create Sponsor
- [x] اتصال admin create sponsor به `POST /api/v1/admin/sponsors`
- [x] تبدیل form data به `SponsorFormDataDto`
- [x] مدیریت validation errors

### ✅ Task 7.4: Admin - Update Sponsor
- [x] اتصال admin edit sponsor به `PATCH /api/v1/admin/sponsors/{sponsorId}`
- [x] ارسال partial update
- [x] مدیریت validation errors

### ✅ Task 7.5: Admin - Delete Sponsor
- [x] اتصال admin delete sponsor به `DELETE /api/v1/admin/sponsors/{sponsorId}`
- [x] مدیریت خطای 404

### ✅ Task 7.6: Public - List Team Members
- [x] اتصال `frontend/src/lib/api/team.ts` به `GET /api/v1/team`
- [x] استفاده در home page

### ✅ Task 7.7: Admin - List All Team Members
- [x] اتصال admin team page به `GET /api/v1/admin/team`
- [x] مدیریت خطاهای 401, 403

### ✅ Task 7.8: Admin - Create Team Member
- [x] اتصال admin create team member به `POST /api/v1/admin/team`
- [x] تبدیل form data به `TeamMemberFormDataDto`
- [x] مدیریت validation errors

### ✅ Task 7.9: Admin - Update Team Member
- [x] اتصال admin edit team member به `PATCH /api/v1/admin/team/{memberId}`
- [x] ارسال partial update
- [x] مدیریت validation errors

### ✅ Task 7.10: Admin - Delete Team Member
- [x] اتصال admin delete team member به `DELETE /api/v1/admin/team/{memberId}`
- [x] مدیریت خطای 404

---

## Feedback/Evaluation

### ✅ Task 8.1: Get Evaluation Form
- [x] اتصال `frontend/src/lib/api/evaluation.ts` به `GET /api/v1/events/{eventId}/evaluation`
- [x] اضافه کردن Authorization header
- [x] مدیریت خطاهای 403, 404
- [x] نمایش form برای user

### ✅ Task 8.2: Submit Evaluation
- [x] اتصال `frontend/src/lib/api/evaluation.ts` به `POST /api/v1/evaluations/{evaluationId}/submit`
- [x] ارسال answers object
- [x] مدیریت خطای 400 (already submitted)
- [x] مدیریت validation errors

### ✅ Task 8.3: Admin - Save Evaluation Form
- [x] اتصال admin evaluation form page به `PATCH /api/v1/admin/events/{eventId}/evaluation`
- [x] ارسال questions array
- [x] مدیریت validation errors

### ✅ Task 8.4: Admin - Get Evaluation Responses
- [x] اتصال admin feedback page به `GET /api/v1/admin/events/{eventId}/evaluation/responses`
- [x] نمایش تمام responses
- [x] مدیریت خطای 404

---

## Admin Features

### ✅ Task 9.1: Admin Dashboard Stats
- [x] اتصال admin dashboard به `GET /api/v1/admin/stats`
- [x] نمایش آمار: upcomingEvents, totalRegistrations, paidRegistrations, totalRevenue
- [x] مدیریت خطاهای 401, 403

---

## Messaging

### ✅ Task 10.1: Admin - Send Bulk Message
- [x] اتصال admin messaging page به `POST /api/v1/admin/messaging/send`
- [x] ارسال: registrationIds, subject, body, channels
- [x] مدیریت validation errors
- [x] نمایش success message

---

## نکات مهم

### Error Handling
- [x] همه API calls باید error handling داشته باشند
- [x] نمایش پیام‌های خطا به کاربر به صورت user-friendly
- [x] مدیریت network errors و timeout

### Type Safety
- [x] استفاده از TypeScript types برای همه API responses
- [x] تطابق types با DTOs در بک‌اند

### Loading States
- [x] نمایش loading indicators در حین API calls
- [x] استفاده از React Query برای مدیریت cache و loading states

### Authentication
- [x] بررسی token expiration
- [x] redirect به login page در صورت 401
- [ ] مدیریت refresh token (اگر پیاده‌سازی شده)

### Testing
- [ ] تست کردن همه API endpoints
- [ ] تست error scenarios
- [ ] تست با data واقعی از دیتابیس
