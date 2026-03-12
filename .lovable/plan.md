

## Switch Auth from Magic Link to Email OTP Code Entry

### Problem
Magic links require a redirect URL that must match the authentication provider's allowed list. Since the site is hosted on GitHub Pages (not published via Lovable), the redirect URL doesn't work, causing errors.

### Solution
Switch to email OTP code entry. The user enters their email, receives a 6-digit code, and types it in to sign in. No redirect needed -- this completely sidesteps the URL issue.

### Changes

**`src/pages/Auth.tsx`** -- Rewrite the auth flow:
1. Keep the email input form as step 1
2. After calling `signInWithOtp({ email })` (same API, just without `emailRedirectTo`), show a 6-digit code input form as step 2
3. On code submit, call `supabase.auth.verifyOtp({ email, token: code, type: 'email' })` to complete sign-in
4. On success, redirect to `/` using `useNavigate`
5. Add a "Resend code" button and "Use a different email" option

No database changes needed. No new dependencies needed (the existing `input-otp` component can be used for the code input).

