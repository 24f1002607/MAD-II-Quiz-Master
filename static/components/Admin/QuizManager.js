export default {
  data() {
    return {
      subjects: [],
      selectedSubject: null,
      showCreateFormFor: null,
      chapters: [],
      form: {
        chapterId: '',
        title: '',
        difficulty: 'Easy',
        quiz_date: '',
        // keep duration string for backend, but split to hours/minutes for input
        duration: '',
        questions_count: 0,
        
      },
      durationHours: 0,
      durationMinutes: 0,
      quizRefreshKey: 0
    };
  },
  created() {
    this.loadSubjects();

    // Optional: auto-open form for a subject if passed via query param
    const qsid = this.$route.query.subjectId;
    if (qsid) {
      this.toggleForm(parseInt(qsid));
    }
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
    loadSubjects() {
      fetch('/api/subject', this.authOpts())
        .then(r => r.json())
        .then(data => this.subjects = data.subjects)
        .catch(err => console.error('Failed to load subjects:', err));
    },
    loadChapters(subjectId) {
      fetch(`/api/subject/${subjectId}/chapters`, this.authOpts())
        .then(r => r.json())
        .then(data => this.chapters = data.chapters)
        .catch(err => console.error('Failed to load chapters:', err));
    },
    toggleForm(subjectId) {
      if (this.showCreateFormFor === subjectId) {
        this.showCreateFormFor = null;
        this.selectedSubject = null;
      } else {
        this.showCreateFormFor = subjectId;
        this.selectedSubject = subjectId;
        this.loadChapters(subjectId);
        this.resetForm();
      }
    },
    resetForm() {
      this.form = {
        chapterId: '',
        title: '',
        difficulty: 'Easy',
        quiz_date: '',
        duration: '',
        questions_count: 0
      };
      this.durationHours = 0;
      this.durationMinutes = 0;
    },
    createQuiz() {
      if (!this.selectedSubject) {
        alert('Please select a subject first.');
        return;
      }
      if (!this.form.chapterId || !this.form.title || !this.form.quiz_date) {
        alert('Please fill all required fields.');
        return;
      }

      // Compose duration string as HH:MM from hours and minutes
      const durationStr =
        String(this.durationHours).padStart(2, '0') + ':' +
        String(this.durationMinutes).padStart(2, '0');

      fetch('/api/quiz', {
        ...this.authOpts(),
        method: 'POST',
        body: JSON.stringify({
          subject_id: this.selectedSubject,
          chapter_id: this.form.chapterId,
          title: this.form.title,
          quiz_date: this.form.quiz_date,
          duration: durationStr,
          difficulty: this.form.difficulty,
          questions_count: this.form.questions_count
        })
      })
        .then(r => {
          if (!r.ok) throw new Error('Failed to create quiz');
          return r.json();
        })
        .then(() => {
          this.loadSubjects(); // refresh quiz counts after creating quiz
          this.showCreateFormFor = null;
          //Directly call onQuizCreated here
          this.onQuizCreated(this.selectedSubject);
        })
        .catch(err => alert(err.message));
    },
    onQuizCreated(subjectId) {
      if (this.$route.fullPath === `/admin_dashboard/quiz/${subjectId}/quizzes`) {
        this.quizRefreshKey++;
      } else {
        this.$router.push(`/admin_dashboard/quiz/${subjectId}/quizzes`);
      }
    }
  },
  template: `
    <div>
      <h3>Quiz Management</h3>

      <div class="row mb-3">
        <div class="col-md-4" v-for="s in subjects" :key="s.subject_id">
          <div class="card p-3 mb-2">
            <h5>{{ s.subject_name }} ({{ s.level }})</h5>

            <!-- ROUTER-LINK to dedicated quiz list route -->
            <router-link
              v-if="s.quiz_count > 0"
              :to="'/admin_dashboard/quiz/' + s.subject_id + '/quizzes'"
              class="btn btn-primary btn-sm mb-1"
            >
              Available Quizzes
            </router-link>
            <small v-else class="text-muted">No quizzes yet</small>

            <!-- Create Quiz Button -->
            <button
              class="btn btn-success btn-sm"
              @click="toggleForm(s.subject_id)"
            >
              Create Quiz
            </button>

            <!-- Inline Create Quiz Form for this subject -->
            <div v-if="showCreateFormFor === s.subject_id" class="mt-3">
              <form @submit.prevent="createQuiz">
                <div class="form-group">
                  <label>Chapter</label>
                  <select v-model="form.chapterId" class="form-control" required :disabled="!chapters.length">
                    <option value="" disabled>Select chapter</option>
                    <option v-for="ch in chapters" :key="ch.chapter_id" :value="ch.chapter_id">
                      {{ ch.chapter_name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Title</label>
                  <input v-model="form.title" class="form-control" required />
                </div>
                <div class="form-group">
                  <label>Quiz Date</label>
                  <input type="datetime-local" v-model="form.quiz_date" class="form-control" required />
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
                  <label>Difficulty</label>
                  <select v-model="form.difficulty" class="form-control">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Number of Questions</label>
                  <input type="number" v-model.number="form.questions_count" class="form-control" min="0" />
                </div>
                <button type="submit" class="btn btn-primary">Save Quiz</button>
                <button type="button" class="btn btn-secondary ml-2" @click="toggleForm(s.subject_id)">Cancel</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- This is required to render child routes (AvailableQuizList) -->
      <router-view :key="quizRefreshKey"></router-view>
    </div>
  `
};
