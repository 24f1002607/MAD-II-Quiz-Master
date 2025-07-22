export default {
    template: `

    <div class="auth-page">
      <div class="card p-4 shadow" style="width: 300px;">
        <h2 class="text-center mb-3">Login Form</h2>

        <p v-if="message" class="text-danger text-center">{{ message }}</p>

        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input type="text" id="email" v-model="formData.email" class="form-control" placeholder="Enter your email">
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input type="password" id="password" v-model="formData.password" class="form-control" placeholder="Enter your password">
        </div>

        <div class="d-grid">
          <button class="btn btn-primary" @click="loginUser">Login</button>
        </div>
      </div>
    </div>
  `,

    data() {
        return {
            formData: {
                email: '',
                password: ''
            },
            message: ''
        };
    },

    methods: {
        loginUser() {
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.formData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.message || "Login failed");
                    });
                }
                return response.json();
            })
            .then(data => {
                // Store token & redirect
                localStorage.setItem("auth_token", data["auth-token"]);
                localStorage.setItem("id", data.id);
                this.$router.push('/dashboard');
            })
            .catch(error => {
                this.message = error.message;
            });
        }
    }
}
