export default {
  template: `
    <div class="auth-page">
      <div class="card p-4 shadow" style="width: 300px;">
        <h2 class="text-center mb-3">Registration Form</h2>

        <p v-if="message" class="text-danger text-center">{{ message }}</p>

        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input type="text" id="email" v-model="formData.email" class="form-control" placeholder="Enter your email">
        </div>

        <div class="mb-3">
          <label for="username" class="form-label">Username</label>
          <input type="text" id="username" v-model="formData.username" class="form-control" placeholder="Enter your username">
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input type="password" id="password" v-model="formData.password" class="form-control" placeholder="Enter your password">
        </div>

        <div class="d-grid">
          <button class="btn btn-primary" @click="addUser">Register</button>
        </div>
      </div>
    </div>
  `,
    

  data() {
    return {
      formData: {
        email: '',
        username: '',
        password: ''
      },
      message: ''
    };
  },

  methods: {
    addUser() {
      fetch('/api/register', {
        method: 'POST',  // FIXED typo
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.formData)
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || "Registration failed");
          });
        }
        return response.json();
      })
      .then(data => {
        alert(data.message);
        this.$router.push('/login');  // FIXED quote and path
      })
      .catch(error => {
        this.message = error.message;
      });
    }
  }
}
