```javascript
document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // Get HTML Elements
    // ==============================

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
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

    togglePassword?.addEventListener("click", () => {

        const isPassword =
            passwordInput.type === "password";

        if (isPassword) {

            passwordInput.type = "text";

            togglePassword.classList.remove(
                "fa-eye-slash"
            );

            togglePassword.classList.add(
                "fa-eye"
            );

        } else {

            passwordInput.type = "password";

            togglePassword.classList.remove(
                "fa-eye"
            );

            togglePassword.classList.add(
                "fa-eye-slash"
            );
        }
    });


    // ==============================
    // Login Form
    // ==============================

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        // ==============================
        // Get Values
        // ==============================

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        // ==============================
        // Clear Previous Message
        // ==============================

        loginMessage.textContent = "";
        loginMessage.className = "form-message";


        // ==============================
        // Frontend Validation
        // ==============================

        if (!email || !password) {

            loginMessage.textContent =
                "Please enter your email and password.";

            loginMessage.classList.add("error");

            return;
        }


        // ==============================
        // Disable Login Button
        // ==============================

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";


        try {

            // ==============================
            // Send Request to Spring Boot
            // ==============================

            const response = await fetch(
                "http://localhost:8080/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );


            // ==============================
            // Get Backend Response
            // ==============================

            const data =
                await response.json().catch(() => ({}));


            // ==============================
            // Login Failed
            // ==============================

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Invalid email or password."
                );
            }


            // ==============================
            // Login Successful
            // ==============================

            loginMessage.textContent =
                "Login successful!";

            loginMessage.classList.add("success");


            // ==============================
            // Save User in Local Storage
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
            // Go to Home Page
            // ==============================

            setTimeout(() => {

                window.location.href =
                    "../index.html";

            }, 1000);


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            // ==============================
            // Connection Error
            // ==============================

            if (error instanceof TypeError) {

                loginMessage.textContent =
                    "Unable to connect to the server. Please make sure Spring Boot is running.";

            } else {

                loginMessage.textContent =
                    error.message;
            }


            loginMessage.classList.add("error");


        } finally {

            // ==============================
            // Enable Button Again
            // ==============================

            loginButton.disabled = false;
            loginButton.textContent = "Log in";

        }

    });

});
```
