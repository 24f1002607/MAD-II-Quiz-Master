export default {
  data() {
    return {
      user: null
    };
  },
  created() {
    fetch('/api/user-dashboard', this.authOpts())
      .then(res => res.json())
      .then(data => this.user = data);
  },
  methods: {
    authOpts() {
      return {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.token
        }
      };
    }
  },
  template: `
    <div v-if="user">
      <h2>Welcome, {{ user.username }}</h2>
      <p>Email: {{ user.email }}</p>
      <p>Qualification: {{ user.qualification }}</p>
      <p>Roles: {{ user.roles.join(', ') }}</p>
    </div>
  `
};
