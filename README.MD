# Tenjin
Tenjin is a study based social media for students at Ontario Tech, where students can create or join various study groups based on their courses.

Live demo: https://tenjin-app.onrender.com/

## Screenshot and Video Demo
[![Demo Youtube video](https://img.youtube.com/vi/1NsMEfQ8dY4/0.jpg)](https://www.youtube.com/watch?v=1NsMEfQ8dY4)

This is just a placeholder for now, we still need an actual screenshot and video.

## Features
- Students can login using their Ontario Tech email, before having a code sent to them.
- Students can provide onboarding details so that they can be better matched against relevant groups.
- Students can filter through groups by their join type, course specificity, by date or match, or by course keywords such as the code, description, or the name.
- Students can create, manage, and edit their own groups, including accepting join requests, editing group information, managing members, leaving groups, and more.
- Students can easily access their settings to edit information about themselves, and delete their accounts.

## Tech Stack
- React
- TypeScript
- Tailwind CSS
- Vite
- Express 5
- Node.js
- PostgreSQL
- Brevo
- Render
- Neon

## Architecture
Architecture can be broken up into four main components:
1. React App -> Browser
2. Express -> JSON, Routes, and the Session Cookie
3. PostgreSQL -> Database, single source of truth
4. Brevo -> HTTPS based email service.

## How Matching Works
| Signal | Weight | Description |
| --- | --- | --- |
| Course | 35% | Whether or not one of the courses you're taking aligns with what the group is taking. |
| Schedule | 30% | Hours that you're free when at least half of the members are. |
| Study style | 15% | Members who study style also matches yours. |
| Program and year | 10% | Based on members who are in the same program, and year as you. |
| Size | 10% | Whether or not the group is within the constraints of your preferred group size. |

## Design Decisions
- Login codes are hashed before being stored, expire after ten minutes, and also lock after 5 incorrect attempts from a user.
- Groups are locked when a user attempts to join, so that the last slot can't be occupied by two people in the rare circumstance that two people attempt to join at the same time.
- Chat links are validated such that the user is required to provide an actual link. Prevents `javascript` links.
- Dependent multi-step processes are maintained by transactions to ensure that failed queries don't leave behind partial completions.
- When ranking, the N+1 problem is avoided entirely by loading both the members and their availability in bulk, before storing in memory.

## Running Tenjin Locally
Requirements:
- Node.js 20+
- PostgreSQL

```bash
git clone https://github.com/tenjin-application/tenjin-app.git
cd tenjin
cd server && npm install && cp .env.example .env
cd ../client && npm install
```

Ensure you have filled in your .env file located in /server.

```bash
createdb tenjin
cd server
npm run migrate
psql tenjin -f seeds/courses.sql
npm run dev
```

Then, in a second terminal:

```bash
cd client && npm run dev
```

As a quick note, when in development, codes are printed in the server terminal, not via. Brevo.

## Testing
```bash
cd server && npm test
```
As of now, unit tests cover the ranking, as well as URL validation. Routes were tested manually.

## Limitations and Next Steps
- No proof of current enrollment, just that you have a student email associated with Ontario Tech University.
- No means to report and moderate as of now.
- Shared types are only partially shared due to an oversight.
- Implement IP based rate-limiting, as opposed to solely relying on the login code attempt restriction.
- Links are not moderated thoroughly, thus the user can freely input whatever they want so long as it is a valid link. Reasonable next step is to restrict the websites they can link to.

## Team
- **Kane Harlowe**: login, onboarding, groups page, compatibility ranking, and deployment
- **Logan Reyes**: dashboard page, including notifications, inbox, and group management
- **Liam Sheridan**: Settings page, including account deletion, and account management
