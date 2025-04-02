document.addEventListener("DOMContentLoaded", (): void => {
  // Initialize your application here
  const content: HTMLElement | null = document.getElementById("content");
  if (content) {
    content.innerHTML = "<p>Welcome to mKit</p>";
  }
});
