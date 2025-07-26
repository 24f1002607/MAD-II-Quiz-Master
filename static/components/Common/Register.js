export default {
  name: "Register",
  template: `
    <div class="auth-page d-flex justify-content-center align-items-center" style="min-height: 90vh;">
      <div class="card p-4 shadow" style="width: 350px;">
        <h2 class="text-center mb-3">Registration Form</h2>

        <p v-if="message" class="text-danger text-center">{{ message }}</p>

        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input type="email" id="email" v-model="formData.email" class="form-control" required />
        </div>

        <div class="mb-3">
          <label for="username" class="form-label">Username</label>
          <input type="text" id="username" v-model="formData.username" class="form-control" required />
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input type="password" id="password" v-model="formData.password" class="form-control" required />
        </div>

        <div class="mb-3">
          <label for="qualification" class="form-label">Qualification</label>
          <select v-model="formData.qualification" id="qualification" class="form-select" required>
            <option disabled value="">Select your qualification</option>
            <option>Admin</option>
            <option>Foundation</option>
            <option>Diploma Data Science</option>
            <option>Diploma Programming</option>
            <option>Degree BSc</option>
            <option>Degree BS</option>
          </select>
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
        password: '',
        qualification: ''
      },
      message: ''
    };
  },

  methods: {
    async addUser() {
      this.message = "";

      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.formData)
        });

        const data = await response.json();

        if (!response.ok) {
          this.message = data.message || "Registration failed";
          return;
        }

        alert(data.message);
        this.$router.push('/login');

      } catch (error) {
        console.error(error);
        this.message = "An unexpected error occurred.";
      }
    }
  }
};
