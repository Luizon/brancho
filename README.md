# Simple TODO List

This project is a lightweight web application for managing task lists (checklists) directly in the browser. It allows creating multiple task lists where each task can have nested subtasks infinitely. It's perfect for organizing activities, pending tasks, or any kind of work requiring structured tracking.

## Main Features

- **Add and remove tasks:** Easily create new tasks or delete them when they're no longer needed.
- **Unlimited subtasks:** Each task can contain subtasks, which in turn can have their own subtasks, with no depth limit.
- **Task descriptions:** Each task can have a detailed description, useful for providing context.
- **Rich descriptions:** Descriptions support clickable links and images. Just add a URL or image address in the description, and the app will automatically format them as `<a>` or `<img>` elements for a more useful and interactive experience.
- **Simple interface:** Everything is managed from a single HTML page, without needing to reload or navigate to other pages.
- **No backend:** The application runs entirely on the frontend. It doesn't make HTTP requests, use sockets, or require external servers.
- **Automatic saving:** Your task list is automatically saved in your browser's LocalStorage. No need for a save button.

## Technologies Used

- HTML
- CSS
- JavaScript (runs entirely in the browser)

## Usage

Visit the online application at [https://luizon.dev/brancho/](https://luizon.dev/brancho/).

- Tasks can be *expanded* or *collapsed* using the **▼ / ▶ toggle button**, allowing you to focus on relevant items.
- Use the **🗑 button** to remove the task, including all their subtasks.
- Each task has a **📝 button** to open a modal where you can add a description.
- Descriptions support links (e.g., `https://example.com`) and image URLs (e.g., `https://example.com/image.png`), which are rendered as clickable links and inline images.
- You can add lists in the descriptions just like this one you're reading :)

## License
This project is licensed under the [MIT License](LICENSE.txt).