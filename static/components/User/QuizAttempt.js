export default {
  props: ['quizId'],
  data() {
    return {
      questions: [],
      answers: {},
      attemptId: null,
      quiz: null,
      timeRemaining: 0,
      timer: null
    };
  },
  created() {
    // Start quiz attempt
    fetch(`/api/quiz/start/${this.quizId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authentication-Token': localStorage.token
      }
    })
    .then(res => res.json())
    .then(data => {
      this.attemptId = data.attempt_id;
      return fetch(`/api/quiz/view/${this.quizId}`, this.authOpts());
    })
    .then(res => res.json())
    .then(data => {
      this.questions = data.questions;
      this.quiz = data.quiz;

      const [hh, mm] = this.quiz.duration.split(":").map(Number);
      this.timeRemaining = (hh * 60 + mm) * 60; // convert to seconds
      this.startTimer();
    });
  },
  methods: {
    authOpts() {
      return {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.token
        }
      };
    },
    startTimer() {
      this.timer = setInterval(() => {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          clearInterval(this.timer);
          this.submitQuiz(true); // auto-submit
        }
      }, 1000);
    },
    formatTime() {
      const min = Math.floor(this.timeRemaining / 60);
      const sec = this.timeRemaining % 60;
      return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    },
    submitQuiz(auto = false) {
      clearInterval(this.timer);
      fetch(`/api/quiz/submit/${this.attemptId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.token
        },
        body: JSON.stringify({ answers: this.answers })
      })
      .then(res => res.json())
      .then(data => {
        alert((auto ? 'Time up! ' : '') + `Your score: ${data.score}`);
        this.$router.push('/user_dashboard/scores'); // redirect to scores
      });
    }
  },
  template: `
    <div v-if="quiz">
      <h3>{{ quiz.quiz_title }} — {{ quiz.difficulty_level }}</h3>
      <p><strong>Time Remaining:</strong> {{ formatTime() }}</p>

      <div v-for="q in questions" :key="q.question_id" class="mb-3">
        <p><strong>{{ q.question_text }}</strong></p>
        <div v-for="n in 4" :key="n" class="form-check">
          <input type="radio" :value="n" :name="'q'+q.question_id"
            v-model="answers[q.question_id]" class="form-check-input"/>
          <label class="form-check-label">{{ q['option' + n] }}</label>
        </div>
      </div>

      <button class="btn btn-success" @click="submitQuiz">Submit Quiz</button>
    </div>
  `
};


