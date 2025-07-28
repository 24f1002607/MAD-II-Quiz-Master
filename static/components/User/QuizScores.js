export default {
  props: ['attemptId'],
  data() {
    return {
      quizTitle: '',
      subject: '',
      username: '',
      score: 0,
      totalScore: 0,
      timeTaken: '',
      details: [],
      loading: false,
      error: null
    };
  },
  created() {
    this.fetchDetailedResult();
  },
  computed: {
    marksPerQuestion() {
      return this.details.length ? (this.totalScore / this.details.length).toFixed(2) : 0;
    }
  },
  methods: {
    fetchDetailedResult() {
      this.loading = true;
      fetch(`/api/quiz/results/${this.attemptId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('token')
        }
      })
        .then(res => res.json())
        .then(data => {
          this.quizTitle = data.quiz_title;
          this.subject = data.subject;
          this.username = data.username;
          this.score = data.score;
          this.totalScore = data.total_score;
          this.timeTaken = data.time_taken;
          this.details = data.details;
          this.loading = false;
        })
        .catch(err => {
          this.error = 'Failed to load result.';
          this.loading = false;
        });
    },
    isCorrect(item) {
      return item.your_answer === item.correct_answer;
    },
    goToScoreHistory() {
      this.$router.push('/user_dashboard/scores');
    }
  },
  template: `
    <div>
      <h3>Quiz Result Summary</h3>

      <div v-if="loading">Loading...</div>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <div v-if="!loading && !error">
        <p><strong>Quiz Title:</strong> {{ quizTitle }}</p>
        <p><strong>Subject:</strong> {{ subject }}</p>
        <p><strong>Username:</strong> {{ username }}</p>
        <p><strong>Score:</strong> {{ score }} / {{ totalScore }}</p>
        <p><strong>Time Taken:</strong> {{ timeTaken }}</p>
        <p><strong>Marks per Question:</strong> {{ marksPerQuestion }}</p>

        <h5 class="mt-4">Incorrect Answers</h5>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Question</th>
              <th>Your Answer</th>
              <th>Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in details.filter(d => !isCorrect(d))" :key="item.question_text">
              <td>{{ item.question_text }}</td>
              <td>{{ item.options ? item.options[item.your_answer] : '—' }}</td>
              <td>{{ item.options ? item.options[item.correct_answer] : '—' }}</td>
            </tr>
          </tbody>
        </table>

        <h5 class="mt-4">Correct Answers</h5>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Question</th>
              <th>Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in details.filter(d => isCorrect(d))" :key="item.question_text">
              <td>{{ item.question_text }}</td>
              <td>{{ item.options ? item.options[item.correct_answer] : '—' }}</td>
            </tr>
          </tbody>
        </table>

        <button class="btn btn-secondary mt-3" @click="goToScoreHistory">Back to Score History</button>
      </div>
    </div>
  `
};
