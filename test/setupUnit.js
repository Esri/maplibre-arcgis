import { vi } from "vitest";
// Provide mock window for maplibre gl js
Object.setPrototypeOf(window, Window.prototype);
window.URL.createObjectURL = vi.fn();
