export default {
  props: ['quizId'],
  data() {
    return {
      quiz: null,
      questions: [],
      loading: true,
      error: null,
      marksPerQuestion: 0
    };
  },
  created() {
    this.loadQuiz();
  },
  methods: {
    authOpts() {
      return { headers: {
        'Content-Type': 'application/json',
        'Authentication-Token': localStorage.getItem('token')
      }};
    },
    loadQuiz() {
      fetch(`/api/quiz/${this.quizId}`, this.authOpts())
        .then(res => {
          if (!res.ok) throw new Error('Cannot load quiz');
          return res.json();
        })
        .then(data => {
          this.quiz = data;
          return fetch(`/api/quiz/view/${this.quizId}`, this.authOpts());
        })
        .then(res => {
          if (!res.ok) throw new Error('Cannot load questions');
          return res.json();
        })
        .then(data => {
          this.questions = data.questions || [];
          if (this.questions.length && this.quiz.total_score) {
            this.marksPerQuestion = (this.quiz.total_score / this.questions.length).toFixed(2);
          }
        })
        .catch(err => {
          console.error(err);
          this.error = err.message;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    goBack() {
      this.$router.push('/admin_dashboard/quiz');
    },
    editQuestion(id) {
      this.$router.push(`/admin_dashboard/quizzes/${this.quizId}/questions/${id}/edit`);
    },
    deleteQuestion(id) {
      if (!confirm('Delete this question?')) return;
      fetch(`/api/question/${id}`, { method: 'DELETE', ...this.authOpts() })
        .then(res => {
          if (!res.ok) throw new Error('Delete failed');
          this.loadQuiz();
        })
        .catch(err => alert(err.message));
    }
  },
  template: `
    <div v-if="loading">Loading quiz...</div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else>
      <h3>Quiz Details</h3>
      <p><strong>Title:</strong> {{ quiz.quiz_title }}</p>
      <p><strong>Difficulty:</strong> {{ quiz.difficulty_level }}</p>
      <p><strong>Duration:</strong> {{ quiz.duration }}</p>
      <p><strong>Total Score:</strong> {{ quiz.total_score }}</p>

      <div v-if="!questions.length">
        <p class="text-warning">Questions to be added</p>
        <button class="btn btn-secondary" @click="goBack">← Back to quizzes</button>
      </div>

      <div v-else>
        <div class="card mb-3" v-for="(q, idx) in questions" :key="q.id">
          <div class="card-body">
            <h5 class="card-title">Q{{ idx+1 }}: {{ q.text }}</h5>
            <ul class="list-group list-group-flush mb-2">
              <li
                v-for="(opt, i) in q.options" :key="i"
                class="list-group-item"
              >
                {{ ['A','B','C','D'][i] }}. {{ opt }}
              </li>
            </ul>
            <button class="btn btn-success" disabled>
              Correct Answer: {{ q.correct_answer }}
            </button>
            <button class="btn btn-warning ms-2" @click="editQuestion(q.id)">
              Edit
            </button>
            <button class="btn btn-danger ms-2" @click="deleteQuestion(q.id)">
              Delete
            </button>
            <div class="mt-2"><strong>Marks:</strong> {{ marksPerQuestion }}</div>
          </div>
        </div>
        <button class="btn btn-secondary" @click="goBack">← Back to quizzes</button>
      </div>
    </div>
  `
};
