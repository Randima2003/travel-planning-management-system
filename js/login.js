document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "http://localhost:8080/api/auth/login";

    // ==============================
    // Get HTML Elements
    // ==============================

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        console.error("loginForm not found.");
        return;
    }

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginButton = document.getElementById("loginButton");
    const loginMessage = document.getElementById("loginMessage");
    const togglePassword = document.getElementById("togglePassword");


    // ==============================
    // Show / Hide Password
    // ==============================

    if (togglePassword) {

        togglePassword.addEventListener("click", () => {

            const isPassword =
                passwordInput.type === "password";

            passwordInput.type =
                isPassword ? "text" : "password";

            togglePassword.classList.toggle(
                "fa-eye",
                isPassword
            );

            togglePassword.classList.toggle(
                "fa-eye-slash",
                !isPassword
            );
        });
    }


    // ==============================
    // Login Form
    // ==============================

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;


        // ==============================
        // Clear Message
        // ==============================

        loginMessage.textContent = "";
        loginMessage.className = "form-message";


        // ==============================
        // Validation
        // ==============================

        if (!email || !password) {

            loginMessage.textContent =
                "Please enter your email and password.";

            loginMessage.classList.add("error");

            return;
        }


        // ==============================
        // Disable Button
        // ==============================

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";


        try {

            // ==============================
            // Send Request
            // ==============================

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });


            // ==============================
            // Read Response
            // ==============================

            const data =
                await response.json().catch(() => ({}));


            // ==============================
            // Handle Error
            // ==============================

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    `Login failed (${response.status})`
                );
            }


            // ==============================
            // Login Successful
            // ==============================

            loginMessage.textContent =
                "Login successful!";

            loginMessage.classList.add("success");


            // ==============================
            // Save User
            // ==============================

            localStorage.setItem(
                "user",
                JSON.stringify({
                    id: data.userId,
                    name: data.name,
                    email: data.email
                })
            );


            // ==============================
            // Redirect
            // ==============================

            setTimeout(() => {

                window.location.href =
                    "../index.html";

            }, 1000);


        } catch (error) {

            console.error("Login error:", error);


            // ==============================
            // Connection / CORS Error
            // ==============================

            if (error instanceof TypeError) {

                loginMessage.textContent =
                    "Cannot connect to the backend. Make sure Spring Boot is running on port 8080 and CORS is enabled.";

            } else {

                loginMessage.textContent =
                    error.message ||
                    "Login failed.";
            }

            loginMessage.classList.add("error");


        } finally {

            loginButton.disabled = false;
            loginButton.textContent = "Log in";
        }

    });

});