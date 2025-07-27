export default {
  props: ['quizId', 'questionId'],
  data() {
    return {
      loading: true,
      error: null,
      question: {
        question_text: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_answer: ''
      }
    };
  },
  created() {
    this.loadQuestion();
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

    loadQuestion() {
      fetch(`/api/question/${this.questionId}`, this.authOpts())
        .then(res => {
          if (!res.ok) throw new Error('Failed to load question');
          return res.json();
        })
        .then(data => {
          this.question = {
            question_text: data.question_text,
            option1: data.option1,
            option2: data.option2,
            option3: data.option3,
            option4: data.option4,
            correct_answer: data.correct_answer
          };
        })
        .catch(err => {
          this.error = err.message || 'Error loading question';
        })
        .finally(() => {
          this.loading = false;
        });
    },

    submit() {
      const { question_text, option1, option2, option3, option4, correct_answer } = this.question;

      // Basic validation
      if (!question_text.trim() || !option1.trim() || !option2.trim() ||
          !option3.trim() || !option4.trim() || !correct_answer.trim()) {
        alert('All fields are required.');
        return;
      }

      // Prepare payload
      const payload = {
        question_text,
        option1,
        option2,
        option3,
        option4,
        correct_answer
      };

      fetch(`/api/question/${this.questionId}`, {
        method: 'PUT',
        ...this.authOpts(),
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to update question');
          alert('Question updated successfully.');
          this.$router.push(`/admin_dashboard/quiz/${this.quizId}/view`);
        })
        .catch(err => {
          alert(err.message || 'Failed to update question.');
        });
    },

    goBack() {
      this.$router.go(-1);
    }
  },

  template: `
    <div>
      <h3>Edit Question</h3>

      <div v-if="loading">Loading question data...</div>
      <div v-else>
        <div v-if="error" class="alert alert-danger">{{ error }}</div>

        <form @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label">Question Text</label>
            <textarea v-model="question.question_text" class="form-control" rows="3" required></textarea>
          </div>

          <div class="mb-3">
            <label class="form-label">Option A</label>
            <input v-model="question.option1" class="form-control" required />
          </div>

          <div class="mb-3">
            <label class="form-label">Option B</label>
            <input v-model="question.option2" class="form-control" required />
          </div>

          <div class="mb-3">
            <label class="form-label">Option C</label>
            <input v-model="question.option3" class="form-control" required />
          </div>

          <div class="mb-3">
            <label class="form-label">Option D</label>
            <input v-model="question.option4" class="form-control" required />
          </div>

          <div class="mb-3">
            <label class="form-label">Correct Answer</label>
            <select v-model="question.correct_answer" class="form-control" required>
              <option disabled value="">Select the correct option</option>
              <option :value="question.option1">Option A</option>
              <option :value="question.option2">Option B</option>
              <option :value="question.option3">Option C</option>
              <option :value="question.option4">Option D</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary">Save Changes</button>
          <button type="button" class="btn btn-secondary ms-2" @click="goBack">Cancel</button>
        </form>
      </div>
    </div>
  `
};
