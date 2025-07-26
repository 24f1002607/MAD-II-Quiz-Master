export default {
  name: "Login",
  template: `
    <div class="auth-page d-flex justify-content-center align-items-center" style="min-height: 90vh;">
      <div class="card p-4 shadow" style="width: 350px;">
        <h2 class="text-center mb-3">Login</h2>

        <p v-if="error" class="text-danger text-center">{{ error }}</p>

        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input type="email" id="email" v-model="email" class="form-control" required autocomplete="email" />
        </div>

        <div class="mb-4">
          <label for="password" class="form-label">Password</label>
          <input type="password" id="password" v-model="password" class="form-control" required autocomplete="current-password" />
        </div>

        <div class="d-grid">
          <button class="btn btn-success" :disabled="loading" @click="loginUser">
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      email: "",
      password: "",
      error: "",
      loading: false,
    };
  },
  methods: {
    async loginUser() {
      this.error = "";
      this.loading = true;

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password,
          }),
        });

        const data = await response.json();
        console.log("Received token:", data.auth_token);

        if (!response.ok) {
          this.error = data.message || "Login failed";
          this.loading = false;
          return;
        }

        const token = data.auth_token || data.token;
        if (!token) {
          this.error = "No token received from server.";
          this.loading = false;
          return;
        } 
        // Save auth details
        localStorage.setItem("token", data.auth_token);
        localStorage.setItem("roles", JSON.stringify(data.roles || []));
        localStorage.setItem("username", data.username);
        localStorage.setItem("user_id", data.id);
        localStorage.setItem("qualification", data.qualification);

        this.loading = false;

        // Wait for Vue's next tick before navigating (avoids redirect error)
        await this.$nextTick();

        // Prioritize admin role
        if (data.roles.includes("admin")) {
          this.$router.push("/admin_dashboard");
        } else if (data.roles.includes("user")) {
          this.$router.push("/user_dashboard");
        } else {
          this.error = "No valid role found.";
        }

      } catch (err) {
        console.error("Login error:", err);
        this.error = "An unexpected error occurred. Please try again.";
      } finally {
        this.loading = false;
      }
    }
  }
};
