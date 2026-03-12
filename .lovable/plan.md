

# Instructional — Course Learning Platform

A course platform inspired by Anthropic's Skilljar, where users can sign up, browse courses, complete lessons, track progress, and earn certificates.

---

## 1. Setup & Authentication
- Enable **Lovable Cloud** for database, auth, and email
- Magic link authentication (email-based, no passwords)
- Auto-send a **greeting email** upon first signup
- User profiles table to store name, avatar, and progress

## 2. Public Pages
- **Landing page** — Hero section with platform branding ("Instructional"), featured courses, and a call-to-action to sign up
- **Course catalog** — Grid of available courses with thumbnails, titles, descriptions, and lesson counts
- **Course detail page** — Overview, lesson list, and enroll button
- **Login/Signup page** — Magic link email input

## 3. Learner Dashboard
- **My Courses** — Enrolled courses with progress bars
- **Lesson viewer** — Markdown-rendered content supporting embedded YouTube videos and images, with a "Mark as Complete" button
- **Progress tracking** — Visual progress per course (e.g., "3 of 8 lessons complete")
- **Certificates page** — View and download earned certificates (auto-generated PDF + digital badge)

## 4. Admin Panel
- **Course management** — Create, edit, delete courses (title, description, thumbnail)
- **Lesson management** — Create, edit, reorder lessons within a course using a **Markdown editor** that renders YouTube embeds and images inline
- **User management** — View registered users and their progress
- **Certificate templates** — Configure certificate design/branding

## 5. Database Structure
- **profiles** — user details (name, avatar, linked to auth.users)
- **user_roles** — role-based access (admin, user) stored separately for security
- **courses** — title, description, thumbnail, published status
- **lessons** — title, markdown content, order, linked to course
- **enrollments** — user ↔ course relationship
- **lesson_progress** — tracks which lessons a user has completed
- **certificates** — issued certificates with unique IDs, linked to user and course

## 6. Certificates
- Auto-issued when all lessons in a course are completed
- **PDF certificate** — downloadable, branded with course name, user name, and completion date
- **Digital badge** — shareable visual badge with a unique verification URL

## 7. Edge Functions
- **send-greeting-email** — triggered on new user signup
- **generate-certificate** — creates PDF certificate on course completion

## 8. Key UX Details
- Clean, modern design with a learning-focused layout
- Mobile-responsive across all pages
- Toast notifications for key actions (enrolled, lesson complete, certificate earned)
- Admin pages protected by role-based access control

