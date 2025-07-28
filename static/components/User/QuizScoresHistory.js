export default {
  data() {
    return {
      scores: [],
      loading: false,
      error: null
    };
  },
  created() {
    this.fetchScores();
  },
  methods: {
    fetchScores() {
      this.loading = true;
      fetch('/api/quiz/results/history', {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('token')
        }
      })
        .then(res => res.json())
        .then(data => {
          this.scores = data;
          this.loading = false;
        })
        .catch(err => {
          this.error = 'Failed to load scores';
          this.loading = false;
        });
    },
    viewDetails(attemptId) {
      this.$router.push(`/user_dashboard/quiz_result/${attemptId}`);
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? 'N/A' : `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    }
  },
  template: `
    <div>
      <h3>Quiz Score History</h3>
      <div v-if="loading">Loading...</div>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <table class="table table-bordered" v-if="scores.length">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Quiz ID</th>
            <th>Attempt ID</th>
            <th>Date Taken</th>
            <th>Difficulty</th>
            <th>Duration</th>
            <th>Time Taken</th>
            <th>Time Exceeded</th>
            <th>Score</th>
            <th>Total Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attempt in scores" :key="attempt.attempt_id">
            <td>{{ attempt.subject }}</td>
            <td>{{ attempt.quiz_id }}</td>
            <td>{{ attempt.attempt_id }}</td>
            <td>{{ formatDate(attempt.date_taken) }}</td>
            <td>{{ attempt.difficulty }}</td>
            <td>{{ attempt.duration }}</td>
            <td>{{ attempt.time_taken }}</td>
            <td>{{ attempt.time_exceeded ? 'Yes' : 'No' }}</td>
            <td>{{ attempt.score }}</td>
            <td>{{ attempt.total_score }}</td>
            <td>
              <button class="btn btn-primary btn-sm" @click="viewDetails(attempt.attempt_id)">
                View Details
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="text-muted">No attempts found.</div>
    </div>
  `
};
