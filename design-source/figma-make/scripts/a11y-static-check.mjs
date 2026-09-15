import { readFile } from "node:fs/promises";
const required = [
  ["src/components/ConfirmDialog.tsx", 'role="alertdialog"', 'aria-modal="true"', "useDialogAccessibility"],
  ["src/components/CreateTaskModal.tsx", 'role="dialog"', 'aria-modal="true"', "useDialogAccessibility", 'htmlFor="task-title"'],
  ["src/components/TaskDetailModal.tsx", 'role="dialog"', 'aria-modal="true"', "useDialogAccessibility"],
  ["src/screens/AuthScreen.tsx", 'htmlFor="sign-in-email"', 'htmlFor="sign-in-password"', 'htmlFor="mfa-code"', 'role="alert"'],
  ["src/screens/OnboardingScreen.tsx", 'htmlFor="onboarding-name"'],
];
let failures = 0;
for (const [file, ...tokens] of required) {
  const content = await readFile(file, "utf8");
  for (const token of tokens) if (!content.includes(token)) { console.error(`${file}: missing ${token}`); failures++; }
}
if (failures) process.exit(1);
console.log(`Accessibility static contract passed for ${required.length} interactive surfaces.`);
