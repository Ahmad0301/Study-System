# NestJS Auth Backend (MongoDB)

Auth-only backend: Sign Up, Sign In, Refresh Token, Forgot Password, Reset Password, Logout.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and paste your **MongoDB Compass / Atlas connection string** into `MONGODB_URI`, e.g.:

```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/auth-db
```

Also set proper random secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (any long random string).

## Run

```bash
npm run start:dev
```

Server runs on `http://localhost:3000` by default.

## Endpoints

| Method | Route                     | Body                              | Description                     |
|--------|---------------------------|------------------------------------|----------------------------------|
| POST   | `/auth/signup`            | `{ name, email, password }`        | Create account                  |
| POST   | `/auth/signin`            | `{ email, password }`              | Login, returns tokens           |
| POST   | `/auth/refresh`           | `{ refreshToken }`                 | Get new access/refresh tokens   |
| POST   | `/auth/forgot-password`   | `{ email }`                        | Generates reset token           |
| POST   | `/auth/reset-password`    | `{ token, newPassword }`           | Sets new password               |
| POST   | `/auth/logout`            | Header: `Authorization: Bearer <accessToken>` | Invalidates refresh token |

## Notes

- Passwords are hashed with bcrypt before saving — never stored in plain text.
- `forgot-password` currently returns the raw reset token directly in the API response
  (marked with a `TODO` in `auth.service.ts`) so you can test it immediately without an
  email provider. Wire up Nodemailer/SendGrid/SES there when ready to actually send emails.
- Access tokens expire in 15 minutes, refresh tokens in 7 days (configurable in `.env`).
- Folder structure:
  ```
  src/
    auth/
      dto/            <- request validation classes
      schemas/        <- Mongoose User schema
      guards/          <- JWT auth guard
      auth.controller.ts
      auth.service.ts
      auth.module.ts
    app.module.ts
    main.ts
  ```
