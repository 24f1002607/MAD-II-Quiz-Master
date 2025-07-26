export default {
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <router-link class="navbar-brand" to="/user_dashboard">Quiz Whiz</router-link>
      <div class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/user_dashboard">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/user_dashboard/scores">My Scores</router-link>
          </li>
        </ul>
        <button class="btn btn-outline-secondary" @click="logout">Logout</button>
      </div>
    </nav>
  `,
  methods: {
    logout() {
      localStorage.clear();
      this.$router.push('/login');
    }
  }
};
