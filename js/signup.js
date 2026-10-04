document.addEventListener("DOMContentLoaded", () => {

    const API_URL =
        "http://localhost:8080/api/auth/register";


    // ==============================
    // Get HTML Elements
    // ==============================

    const signupForm =
        document.getElementById("signupForm");

    const usernameInput =
        document.getElementById("username");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const signupButton =
        document.getElementById("signupButton");

    const signupMessage =
        document.getElementById("signupMessage");

    const togglePassword =
        document.getElementById("togglePassword");


    if (!signupForm) {

        console.error(
            "signupForm not found in the page."
        );

        return;
    }


    // ==============================
    // Email Validation
    // ==============================

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    // ==============================
    // Show Message
    // ==============================

    function showMessage(text, type) {

        signupMessage.textContent = text;

        signupMessage.className =
            "form-message " + type;
    }


    // ==============================
    // Show / Hide Password
    // ==============================

    if (togglePassword) {

        togglePassword.addEventListener(
            "click",
            () => {

                const isHidden =
                    passwordInput.type === "password";

                passwordInput.type =
                    isHidden ? "text" : "password";

                togglePassword.classList.toggle(
                    "fa-eye",
                    isHidden
                );

                togglePassword.classList.toggle(
                    "fa-eye-slash",
                    !isHidden
                );

                togglePassword.title =
                    isHidden
                        ? "Hide password"
                        : "Show password";
            }
        );
    }


    // ==============================
    // Signup
    // ==============================

    signupForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // ==============================
            // Get Values
            // ==============================

            const username =
                usernameInput.value.trim();

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            showMessage("", "");


            // ==============================
            // Validation
            // ==============================

            if (!username || !email || !password) {

                showMessage(
                    "Please fill in all fields.",
                    "error"
                );

                return;
            }


            if (username.length < 3) {

                showMessage(
                    "Username must contain at least 3 characters.",
                    "error"
                );

                return;
            }


            if (!emailRegex.test(email)) {

                showMessage(
                    "Please enter a valid email address.",
                    "error"
                );

                return;
            }


            if (password.length < 8) {

                showMessage(
                    "Password must contain at least 8 characters.",
                    "error"
                );

                return;
            }


            // ==============================
            // Disable Button
            // ==============================

            signupButton.disabled = true;

            signupButton.textContent =
                "Creating account...";


            let success = false;


            try {

                // ==============================
                // Send Request
                // ==============================

                const response = await fetch(
                    API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            username: username,
                            email: email,
                            password: password
                        })
                    }
                );


                // ==============================
                // Read Response
                // ==============================

                const data =
                    await response
                        .json()
                        .catch(() => ({}));


                // ==============================
                // Handle Error
                // ==============================

                if (!response.ok) {

                    if (response.status === 403) {

                        throw new Error(
                            "Registration blocked by the server (403). Check Spring Security, CSRF and CORS configuration."
                        );
                    }


                    throw new Error(
                        data.message ||
                        data.error ||
                        `Registration failed (${response.status})`
                    );
                }


                // ==============================
                // Success
                // ==============================

                success = true;

                showMessage(
                    "Account created successfully!",
                    "success"
                );


                signupForm.reset();


                // ==============================
                // Go To Login
                // ==============================

                setTimeout(() => {

                    window.location.href =
                        "login.html";

                }, 1000);


            } catch (error) {

                console.error(
                    "Signup error:",
                    error
                );


                if (error instanceof TypeError) {

                    showMessage(
                        "Cannot connect to the server. Make sure Spring Boot is running on port 8080 and CORS is enabled.",
                        "error"
                    );

                } else {

                    showMessage(
                        error.message ||
                        "Registration failed.",
                        "error"
                    );
                }


            } finally {

                if (!success) {

                    signupButton.disabled = false;

                    signupButton.textContent =
                        "Sign up with email";
                }
            }
        }
    );

});