// components/User/ViewQuizUser.js
export default {
  props: ['quizId'],

  data() {
    return {
      quiz: null,
      loading: true,
      error: null
    };
  },
  created() {
    this.fetchQuizDetails();
  },
  methods: {
    authOpts() {
      return {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('token')
        }
      };
    },
    fetchQuizDetails() {
      const quizId = this.$route.params.quizId;
      fetch(`/api/quiz/view/${this.quizId}`, this.authOpts())
        .then(res => {
          if (!res.ok) throw new Error("Failed to load quiz details");
          return res.json();
        })
        .then(data => {
          this.quiz = data;
        })
        .catch(err => {
          this.error = err.message;
        })
        .finally(() => {
          this.loading = false;
        });
    }
  },
  template: `
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else>
      <h3 class="mb-4">Quiz Details</h3>
      <div class="card">
        <div class="card-body">
          <p><strong>Quiz ID:</strong> {{ quiz.quiz_id }}</p>
          <p><strong>Title:</strong> {{ quiz.quiz_title }}</p>
          <p><strong>Subject:</strong> {{ quiz.subject_name }}</p>
          <p><strong>Chapter:</strong> {{ quiz.chapter_name }}</p>
          <p><strong>Number of Questions:</strong> {{ quiz.questions_count }}</p>
          <p><strong>Difficulty Level:</strong> {{ quiz.difficulty_level }}</p>
          <p><strong>Duration:</strong> {{ quiz.duration }}</p>
          <p><strong>Total Score:</strong> {{ quiz.total_score }}</p>
          <p><strong>Created Date:</strong> {{ quiz.quiz_date }}</p>
        </div>
      </div>
    </div>
  `
};
