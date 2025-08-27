// Provide mock window for maplibre gl js
Object.setPrototypeOf(window, Window.prototype);
window.URL.createObjectURL = (object) => {
  return '';
};

// TODO load dummy data
