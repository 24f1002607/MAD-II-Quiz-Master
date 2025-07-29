export default {
  data() {
    return {
      users: [],
      expandedUserId: null  // to track which user's details are shown
    };
  },
  created() {
    this.load();
  },
  methods: {
    load() {
      fetch('/api/admin-dashboard', this.authOpts())
        .then(r => r.json())
        .then(r => this.users = r.users);
    },
    authOpts() {
      return {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.token
        }
      };
    },
    toggleDetails(userId) {
      this.expandedUserId = this.expandedUserId === userId ? null : userId;
    }
  },
  template: `
    <div class="container mt-4">
      <h3 class="text-center mb-4">Users</h3>
      <table class="table table-bordered table-striped">
        <thead class="thead-dark">
          <tr>
            <th>User ID</th>
            <th>Username</th>
            <th>Qualification</th>
            <th>Email</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.qualification }}</td>
            <td>{{ user.email }}</td>
            <td>
              <button class="btn btn-sm btn-info" @click="toggleDetails(user.id)">
                {{ expandedUserId === user.id ? 'Hide' : 'Show' }} Attempts
              </button>
            </td>
          </tr>

          <!-- Expandable Quiz Attempt Row -->
          <tr v-if="expandedUserId === user.id" v-for="user in users" :key="'details-' + user.id">
            <td colspan="5">
              <div class="p-3 bg-light border rounded">
                <h5 class="mb-3">Quiz Attempts for {{ user.username }}</h5>
                <table class="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Quiz ID</th>
                      <th>Attempt ID</th>
                      <th>Date Taken</th>
                      <th>Difficulty</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="attempt in user.quiz_attempts.filter(a => a.completed_at)" :key="attempt.attempt_id">
                      <td>{{ attempt.subject }}</td>
                      <td>{{ attempt.quiz_id }}</td>
                      <td>{{ attempt.attempt_id }}</td>
                      <td>{{ new Date(attempt.attempt_date).toLocaleString() }}</td>
                      <td>{{ attempt.difficulty_level }}</td>
                      <td>{{ attempt.score }}</td>
                    </tr>
                    <tr v-if="user.quiz_attempts.filter(a => a.completed_at).length === 0">
                      <td colspan="6" class="text-center text-muted">No completed attempts</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
};
