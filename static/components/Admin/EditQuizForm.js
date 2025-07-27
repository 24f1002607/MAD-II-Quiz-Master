export default {
  props: ['quizId'],
  data() {
    return {
      quiz: {
        quiz_title: '',
        chapter_id: null,
        subject_id: null,
        difficulty: '',
        // keep duration as string for display/storage, but we'll split it
        duration: '',
        quiz_date: '',
        questions_count: 0
      },
      durationHours: 0,
      durationMinutes: 0,
      chapters: [],
      loading: true,
      error: null
    };
  },
  created() {
    this.fetchQuiz();
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

    fetchQuiz() {
      fetch(`/api/quiz/${this.quizId}`, this.authOpts())
        .then(res => res.json())
        .then(data => {
          this.quiz = {
            quiz_title: data.quiz_title,
            chapter_id: data.chapter_id,
            difficulty: data.difficulty,
            duration: data.duration,
            quiz_date: data.quiz_date.slice(0, 16),
            questions_count: data.questions_count
          };

          // Parse duration "HH:MM" into hours and minutes
          if (this.quiz.duration && this.quiz.duration.includes(':')) {
            const [h, m] = this.quiz.duration.split(':').map(Number);
            this.durationHours = h;
            this.durationMinutes = m;
          } else {
            this.durationHours = 0;
            this.durationMinutes = 0;
          }

          return this.fetchChapters(data.chapter_id);
        })
        .catch(err => {
          console.error(err);
          this.error = "Failed to load quiz data.";
          this.loading = false;
        });
    },

    fetchChapters(chapterId) {
      fetch(`/api/chapter/${chapterId}`, this.authOpts())
        .then(res => res.json())
        .then(data => {
          const subjectId = data.chapter.subject_id;
          this.quiz.subject_id = subjectId;

          return fetch(`/api/subject/${subjectId}/chapters`, this.authOpts());
        })
        .then(res => res.json())
        .then(data => {
          this.chapters = data.chapters;
          this.loading = false;
        })
        .catch(err => {
          console.error(err);
          this.error = "Failed to load chapters.";
        });
    },

    updateQuiz() {
      // Combine hours and minutes into HH:MM string
      const durationStr =
        String(this.durationHours).padStart(2, '0') + ':' +
        String(this.durationMinutes).padStart(2, '0');

      const body = JSON.stringify({
        title: this.quiz.quiz_title,
        chapter_id: this.quiz.chapter_id,
        difficulty: this.quiz.difficulty,
        duration: durationStr,
        questions_count: this.quiz.questions_count
      });

      fetch(`/api/quiz/${this.quizId}`, {
        method: 'PUT',
        ...this.authOpts(),
        body
      })
        .then(res => {
          if (!res.ok) throw new Error("Failed to update quiz");
          alert("Quiz updated successfully!");
          this.$router.push('/admin_dashboard/quiz');
        })
        .catch(err => {
          console.error(err);
          alert("Failed to update quiz.");
        });
    }
  },
  template: `
    <div v-if="loading">Loading...</div>
    <div v-else>
      <h3>Edit Quiz</h3>
      <form @submit.prevent="updateQuiz">
        <div class="form-group">
          <label>Quiz Title</label>
          <input v-model="quiz.quiz_title" class="form-control" required />
        </div>

        <div class="form-group">
          <label>Chapter</label>
          <select v-model="quiz.chapter_id" class="form-control" required>
            <option v-for="chapter in chapters" :value="chapter.chapter_id">
              {{ chapter.chapter_name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Difficulty</label>
          <select v-model="quiz.difficulty" class="form-control" required>
            <option disabled value="">Select</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>

        <div class="form-group">
          <label>Duration (HH:MM)</label>
          <div style="display: flex; gap: 10px; max-width: 150px;">
            <input
              type="number"
              min="0"
              v-model.number="durationHours"
              class="form-control"
              placeholder="Hours"
              required
            />
            <input
              type="number"
              min="0"
              max="59"
              v-model.number="durationMinutes"
              class="form-control"
              placeholder="Minutes"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label>Quiz Date & Time</label>
          <input type="datetime-local" v-model="quiz.quiz_date" class="form-control" required />
        </div>

        <div class="form-group">
          <label>Number of Questions</label>
          <input type="number" v-model.number="quiz.questions_count" class="form-control" required />
        </div>

        <button type="submit" class="btn btn-primary">Update Quiz</button>
      </form>
    </div>
  `
};
