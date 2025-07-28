export default {
  props: ['quizId'],
  data() {
    return {
      questions: [],
      answers: {},
      attemptId: null,
      quiz: null,
      timeRemaining: 0,
      timer: null,
      submitted: false,
    };
  },
  computed: {
    formattedDuration() {
      if (!this.quiz || !this.quiz.duration) return '';

      let totalSeconds = 0;

      if (typeof this.quiz.duration === 'string' && this.quiz.duration.includes(':')) {
        const [hh, mm] = this.quiz.duration.split(':').map(Number);
        totalSeconds = (hh * 60 + mm) * 60;
      } else {
        totalSeconds = Number(this.quiz.duration) * 60;
      }

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const parts = [];
      if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
      parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

      return 'Duration: ' + parts.join(', ');
    },
    progress() {
      const total = this.questions.length;
      if (total === 0) return 0;
      const answered = Object.keys(this.answers).filter(qid => this.answers[qid] !== undefined).length;
      return Math.round((answered / total) * 100);
    },
    unansweredQuestions() {
      return this.questions.filter(q => this.answers[q.question_id] === undefined);
    }
  },
  created() {
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

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
      return fetch(`/api/user/quiz/view/${this.quizId}`, this.authOpts());
    })
    .then(res => res.json())
    .then(data => {
      this.questions = data.questions || [];
      this.quiz = data.quiz || null;

      // Safety check for duration
      if (!this.quiz || !this.quiz.duration) {
        this.timeRemaining = 0;
      } else if (typeof this.quiz.duration === 'string' && this.quiz.duration.includes(':')) {
        const [hh, mm] = this.quiz.duration.split(":").map(Number);
        this.timeRemaining = (hh * 60 + mm) * 60; // convert to seconds
      } else {
        this.timeRemaining = Number(this.quiz.duration) * 60;
      }

      this.startTimer();
    })
    .catch(() => {
      // Handle fetch failure gracefully
      this.timeRemaining = 0;
      this.questions = [];
      this.quiz = null;
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
      if (this.timeRemaining <= 0) return; // no timer if no time set

      this.timer = setInterval(() => {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          clearInterval(this.timer);
          this.submitQuiz(true); // auto-submit
        }
      }, 1000);
    },
    formatTime() {
      const hours = Math.floor(this.timeRemaining / 3600);
      const minutes = Math.floor((this.timeRemaining % 3600) / 60);
      const seconds = this.timeRemaining % 60;

      const parts = [];
      if (hours > 0) parts.push(String(hours).padStart(2, '0'));
      parts.push(String(minutes).padStart(2, '0'));
      parts.push(String(seconds).padStart(2, '0'));

      return parts.join(':'); // HH:MM:SS or MM:SS
    },
    confirmSubmit() {
      if (this.unansweredQuestions.length) {
        if (!confirm(`You have ${this.unansweredQuestions.length} unanswered question(s). Are you sure you want to submit?`)) {
          return;
        }
      }
      this.submitQuiz();
    },
    submitQuiz(auto = false) {
      if (this.submitted) return;
      this.submitted = true;

      clearInterval(this.timer);
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);

      fetch(`/api/quiz/submit/${this.attemptId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('token')
        },
        body: JSON.stringify({ answers: this.answers })
      })
      .then(res => {
        if(!res.ok) {
          throw new Error('Failed to submit quiz');
        }
        return res.json();
      })
      .then(data => {
        this.$router.push(`/user_dashboard/quiz_result/${this.attemptId}`);
      })
      .catch(err =>{
        alert('Error submitting quiz: ' + err.message);
      });
        
      
    },
    beforeUnloadHandler(event) {
      if (!this.submitted) {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome to show prompt
      }
    },
    goBack() {
      if (!this.submitted && this.unansweredQuestions.length > 0) {
        if (!confirm(`You have unanswered questions. Leaving will discard your progress. Continue?`)) {
          return;
        }
      }
      clearInterval(this.timer);
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.$router.push('/user_dashboard');
    }
  },
  beforeDestroy() {
    clearInterval(this.timer);
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  },
  template: `
    <div v-if="quiz">
      <h3>{{ quiz.quiz_title }} — {{ quiz.difficulty_level }}</h3>
      <p><strong>{{ formattedDuration }}</strong></p>
      <p><strong>Time Remaining:</strong> {{ formatTime() }}</p>

      <!-- Progress Bar -->
      <div class="progress mb-3" style="height: 25px;">
        <div
          class="progress-bar"
          role="progressbar"
          :style="{ width: progress + '%' }"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          {{ progress }}%
        </div>
      </div>

      <div v-for="q in questions" :key="q.question_id" class="mb-3" :class="{ 'border border-danger p-2 rounded': answers[q.question_id] === undefined }">
        <p><strong>{{ q.question_text }}</strong></p>
        <div v-for="n in 4" :key="n" class="form-check">
          <input type="radio" :value="n" :name="'q'+q.question_id"
            v-model="answers[q.question_id]" class="form-check-input" :id="'q'+q.question_id+'option'+n"/>
          <label class="form-check-label" :for="'q'+q.question_id+'option'+n">{{ q['option' + n] }}</label>
        </div>
      </div>

      <button class="btn btn-success" @click="confirmSubmit">Submit Quiz</button>
      <button class="btn btn-secondary ml-2" @click="goBack">Back to Dashboard</button>
    </div>
  `
};
