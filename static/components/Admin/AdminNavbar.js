export default {
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <router-link class="navbar-brand" to="/admin_dashboard">Admin</router-link>
      <div class="collapse navbar-collapse">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item"><router-link class="nav-link" to="/admin_dashboard/subjects">Quiz</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/admin_dashboard/users">Users</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/admin_dashboard/search">Search</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/admin_dashboard/charts">Analytics</router-link></li>
        </ul>
        <button class="btn btn-outline-light" @click="logout">Logout</button>
      </div>
    </nav>`,
  methods: {
    logout() {
      localStorage.clear();
      this.$router.push('/login');
    }
  }
};
