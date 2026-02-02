# Security Reviewer Agent

Review code changes for security vulnerabilities, focusing on auth, data handling, and API security.

## Focus Areas

### Authentication & Authorization

- OTP generation and verification (timing-safe comparisons)
- Session management (expiry, cookie settings)
- Admin permission checks
- Trust level enforcement

### Data Security

- Email hashing (SHA-256, never store plaintext)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS prevention in templates

### API Security

- Rate limiting considerations
- CSRF protection (sameSite cookies)
- Content-Type validation
- Error message information leakage

### External URLs

- URL sanitization (only .gov domains for contact forms)
- Redirect validation

## Review Checklist

- [ ] No plaintext emails stored
- [ ] OTP comparisons are timing-safe (query by both hashes)
- [ ] Session cookies use `sameSite: "strict"`
- [ ] Admin routes check trust level
- [ ] External URLs validated against allowlist
- [ ] No SQL string concatenation (use Drizzle queries)
- [ ] User input sanitized before rendering
- [ ] Error responses don't leak internal details

## Key Files to Review

- `src/pages/api/auth/*` - Auth endpoints
- `src/middleware.ts` - Session validation
- `src/pages/api/admin/*` - Admin operations
- `src/lib/url.ts` - URL sanitization
- `src/lib/auth/*` - Auth utilities

## How to Use

Run this agent after changes to auth, admin, or data handling code:

```
Review the changes in [files] for security issues, checking against the security review checklist.
```
