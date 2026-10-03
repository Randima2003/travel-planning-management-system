document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "http://localhost:8080/api/auth/register";

    const signupForm = document.getElementById("signupForm");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const signupButton = document.getElementById("signupButton");
    const signupMessage = document.getElementById("signupMessage");
    const togglePassword = document.getElementById("togglePassword");

    if (!signupForm) {
        console.error("signupForm not found in the page.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function showMessage(text, type) {
        signupMessage.textContent = text;
        signupMessage.className = "form-message " + type;
    }

    // Show / Hide Password
    if (togglePassword) {
        togglePassword.addEventListener("click", () => {
            const isHidden = passwordInput.type === "password";

            passwordInput.type = isHidden ? "text" : "password";
            togglePassword.classList.toggle("fa-eye", isHidden);
            togglePassword.classList.toggle("fa-eye-slash", !isHidden);
            togglePassword.title = isHidden ? "Hide password" : "Show password";
        });
    }

    // Signup
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        showMessage("", "");

        // Validation
        if (!username || !email || !password) {
            showMessage("Please fill in all fields.", "error");
            return;
        }

        if (username.length < 3) {
            showMessage("Username must contain at least 3 characters.", "error");
            return;
        }

        if (!emailRegex.test(email)) {
            showMessage("Please enter a valid email address.", "error");
            return;
        }

        if (password.length < 8) {
            showMessage("Password must contain at least 8 characters.", "error");
            return;
        }

        signupButton.disabled = true;
        signupButton.textContent = "Creating account...";

        let success = false;

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error(
                        "Registration was blocked by the server (403). The backend must allow public POST requests to /api/auth/register and configure CSRF/CORS correctly."
                    );
                }

                throw new Error(
                    data.message ||
                    data.error ||
                    `Registration failed (${response.status})`
                );
            }

            // SUCCESS
            success = true;
            showMessage("Account created successfully!", "success");
            signupForm.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);

        } catch (error) {
            console.error("Signup error:", error);

            if (error instanceof TypeError) {
                // fetch() network / CORS failure
                showMessage(
                    "Cannot reach the server. Check that the backend is running on port 8080 and CORS is enabled.",
                    "error"
                );
            } else {
                showMessage(error.message || "Registration failed.", "error");
            }

        } finally {
            // Keep button disabled after success (page is redirecting)
            if (!success) {
                signupButton.disabled = false;
                signupButton.textContent = "Sign up with email";
            }
        }
    });
});