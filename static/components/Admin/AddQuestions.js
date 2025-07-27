export default {
  props: ['subjectId', 'quizId'],

  data() {
    return {
      quiz: {
        quiz_title: '',
        questions_count: 0,
        total_score: 0,
        questions: []
      },
      question: {
        question_text: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_answer: 1,
        chapter_id: null
      },
      chapters: []
    };
  },

  computed: {
    marksPerQuestion() {
      const count = this.quiz.questions_count || 1;
      return Math.round(this.quiz.total_score / count);
    }
  },

  created() {
    // Only rely on props for quizId & subjectId
    this.loadQuiz();
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

    loadChaptersForSubject(subjectId) {
      fetch(`/api/subject/${subjectId}/chapters`, this.authOpts())
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch chapters');
          return res.json();
        })
        .then(data => {
          this.chapters = data.chapters || [];
        })
        .catch(err => {
          console.error(err);
          alert('Could not load chapters for this subject.');
        });
    },

    loadQuiz() {
      fetch(`/api/quiz/view/${this.quizId}`, this.authOpts())
        .then(res => {
          if (!res.ok) throw new Error('Failed to load quiz');
          return res.json();
        })
        .then(data => {
          this.quiz = data;
          if (this.subjectId == null) {
            // Fallback to subject_id from quiz data if subjectId missing
            this.subjectId = data.subject_id;
          }
          this.loadChaptersForSubject(this.subjectId);
        })
        .catch(err => {
          console.error(err);
          alert('Failed to load quiz data.');
        });
    },

    submitQuestion() {
      fetch(`/api/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('token')
        },
        body: JSON.stringify({
          ...this.question,
          quiz_id: this.quizId,
          chapter_id: this.question.chapter_id,
          marks: this.marksPerQuestion
        })
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to add question');
          return res.json();
        })
        .then(() => {
          // Keep the selected chapter for next question
          this.question = {
            question_text: '',
            option1: '',
            option2: '',
            option3: '',
            option4: '',
            correct_answer: 1,
            chapter_id: this.question.chapter_id
          };
          this.loadQuiz();
        })
        .catch(err => {
          console.error(err);
          alert('Failed to add question.');
        });
    }
  },

  template: `
    <div>
      <h3>Add Questions for "{{ quiz.quiz_title }}"</h3>
      <p>
        Questions Added: {{ quiz.questions.length }} / {{ quiz.questions_count }}<br>
        <strong>Marks per Question: {{ marksPerQuestion }}</strong>
      </p>

      <div v-if="quiz.questions.length >= quiz.questions_count" class="alert alert-success">
        All required questions have been added.
      </div>

      <form v-else @submit.prevent="submitQuestion">
        <div class="form-group">
          <label>Question Text</label>
          <textarea v-model="question.question_text" class="form-control" required></textarea>
        </div>

        <div class="form-group" v-for="n in 4" :key="n">
          <label>Option {{ n }}</label>
          <input v-model="question['option' + n]" class="form-control" required />
        </div>

        <div class="form-group">
          <label>Select Chapter</label>
          <select v-model.number="question.chapter_id" class="form-control" required>
            <option disabled value="">-- Select a Chapter --</option>
            <option v-for="ch in chapters" :key="ch.chapter_id" :value="ch.chapter_id">
              {{ ch.chapter_name || ch.title }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Correct Answer (1–4)</label>
          <input type="number" v-model.number="question.correct_answer" min="1" max="4" class="form-control" required />
        </div>

        <button class="btn btn-success" type="submit">Add Question</button>
      </form>

      <button class="btn btn-secondary mt-3" @click="$router.go(-1)">Back</button>
    </div>
  `
};
