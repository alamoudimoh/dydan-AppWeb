![Logo](assets/image.png)

## DayDan Frontend

The DayDan frontend is the React/Vite client for DayDan written in javascript with React

## What is DayDan?

An open-source, user-friendly app for managing tasks and chores, featuring customizable options to help you and others stay organized.

## About DayDan

DayDan is an independently developed, open-source and privacy-focused task management tool for people who want a customizable way to organize chores and shared work.

DayDan originated from the open-source Donetick project and has since evolved as an independently developed DayDan product.

## Features

- Task and Chore Management: Easily create, edit, and manage tasks and chores for yourself or your group.
- Shared To-Do Lists: Create "Circles" to collaborate on tasks with family or your group
- Assignee Assignment: Assign tasks to specific individuals or rotate them automatically using customizable strategies.
- Recurring Tasks: Schedule tasks to repeat daily, weekly, monthly, or yearly, with flexible customization options.
- Progress Tracking: Track the completion status of tasks and view historical data.

## Development Environment

The full development workflow, including the paired frontend and backend setup, is documented in the [DayDan Server development guide](https://github.com/alamoudimoh/DayDan-Server#development-environment). The frontend repository is [DayDan-AppWeb](https://github.com/alamoudimoh/DayDan-AppWeb).

## Builds

`npm run build` produces the canonical production bundle. By default the API
base URL is empty, which makes the app use same-origin relative `/api` URLs —
safe for self-hosted deployments behind any IP, hostname, or reverse proxy,
with no rebuild needed when the server address changes.

Only set `VITE_APP_API_URL` (e.g. in `.env.production.local` or your CI
environment) if you host the API on a different origin than the frontend.

## Frontend verification gates

Production-UI changes must keep Playwright fixture tests green. In addition to
`e2e/production-ui-phase3.spec.js` (calendar, archived, notifications, meters,
maintenance, family, rewards, chore detail, shared dialogs), Phase 3 covers the
Home and Today screens:

- `e2e/production-ui-home-today.spec.js` exercises `/` (FocusHome) and `/today`
  (TodayScreen) across the standard viewport/theme/language cases, plus a
  live-completion round trip on a due-today chore, the family household toggle,
  and the sidebar `Today` navigation link. Runs are gated by the runtime error
  guard, which fails on any uncaught error, console error, or unmocked API call.

## Contributing

Contributions are welcome! If you would like to contribute to DayDan, please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## Need Help:

DayDan is a work in progress and has been a fantastic learning experience for me as I've honed my React skills,I'm looking for collaborators to help improve and refine DayDan. Feel free to open PR or suggest changes.

## Plans:

My goal is to expand DayDan by offering a hosted infrastructure option. This will make it even easier for users to access and utilize DayDan's features without the need for self-hosting.

While maintaining DayDan's commitment to open source, this hosted option will provide a seamless, out-of-the-box experience for those who prefer a managed solution.

## License

This project is licensed under the AGPLv3 License. See the [LICENSE](LICENSE) file for more details. I might consider changing it later to something else
