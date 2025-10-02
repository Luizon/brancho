# Brancho — Hierarchical TODO List

This project is a lightweight web application for managing task lists (checklists) with infinite nesting. It supports optional accounts with cloud sync, while still working fully offline with LocalStorage.

## Main Features

- **Add and remove tasks:** Easily create or delete tasks and their subtasks.
- **Unlimited subtasks:** Nest subtasks to any depth.
- **Task descriptions:** Add rich context to each task.
- **Rich descriptions:** Paste links and image URLs; they render as clickable `<a>` or inline `<img>`. Supports simple lists too.
- **Simple interface:** Single-page UI — no navigation.
- **Automatic local saving:** Tasks are saved to your browser’s LocalStorage.
- **Accounts and cloud sync:** Register/login to save your tasks to the cloud.
- **Manual save + Autosave:** Click “Save to Cloud” or enable autosave (every ~10 minutes).
- **Conflict resolution:** If local and cloud copies differ on login, choose which one to keep.
- **Account management:** Update display name, change password, or delete your account.
- **Import/Export:** Save your list to a `.txt` file and load it later.

## Technologies Used

- HTML
- CSS
- JavaScript (frontend)
- REST API backend with JWT auth
- LocalStorage for offline persistence

## Usage

Visit the online application at [https://luizon.dev/brancho/](https://luizon.dev/brancho/).

### Without an account
- Start adding tasks; your data is saved locally in the browser.
- Expand/collapse using the **▼ / ▶** toggle.
- Use **🗑** to remove a task (and its subtasks).
- Use **📝** to add/edit a description. Links and image URLs render automatically.

### With an account (cloud sync)
- Click **Login** or **Register** in the header.
- After login, the app loads your cloud tasks. If your local and cloud copies differ, you’ll be asked to pick one.
- Click **Save to Cloud** to upload your current list.
- Toggle **Autosave** in the user menu to periodically save automatically.

### Account management
- Open the user menu (☰) and choose: **Update name**, **Change password**, or **Delete account**.

### Import/Export
- Use the floating menu (+) to **Save to File** (`.txt`) or **Load from File**.

## License
This project is licensed under the [MIT License](LICENSE.txt).