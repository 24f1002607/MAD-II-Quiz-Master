export default {
  props: ['subjectId'],
  data() {
    return {
      quizzes: [],
      subjectName: '' // optional: for showing dynamic heading
    };
  },
  created() {
    this.load();
  },
  watch: {
    subjectId: {
      immediate: true,
      handler() {
        this.load();
      }
    }
  },
  methods: {
    load() {
      fetch(`/api/subject/${this.subjectId}/quizzes`, this.authOpts())
        .then(res => {
          if (!res.ok) throw new Error('Failed to load quizzes');
          return res.json();
        })
        .then(data => {
          console.log('Quizzes:', data.quizzes);
          this.quizzes = data.quizzes;

          // Optional: fetch subject name for heading
          return fetch(`/api/subject/${this.subjectId}`, this.authOpts());
        })
        .then(res => res.json())
        .then(data => {
          this.subjectName = data.subject.subject_name;
        })
        .catch(err => {
          console.error(err);
          alert('Failed to load quizzes for the selected subject.');
        });
    },
    authOpts({ includeContentType = true } = {}) {
      const headers = {
        'Authentication-Token': localStorage.getItem('token')
      };
      if (includeContentType) {
        headers['Content-Type'] = 'application/json';
      }
      return { headers };
    },
    deleteQuiz(quizId) {
      if (!confirm('Are you sure you want to delete this quiz?')) return;
      fetch(`/api/quiz/${quizId}`, {
        method: 'DELETE',
        ...this.authOpts({ includeContentType: false })
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to delete quiz');
          alert('Quiz deleted successfully');
          this.load(); // Refresh list
        })
        .catch(err => {
          console.error(err);
          alert('Failed to delete quiz');
        });
    }
  },
  template: `
    <div>
      <h3>Available Quizzes for {{ subjectName || 'this Subject' }}</h3>
      
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Quiz Id</th>
            <th>Quiz Title</th>
            <th>Total Questions</th>
            <th>Questions to Add</th>
            <th>Difficulty Level</th>
            <th>Duration</th>
            <th>Total Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="q in quizzes" :key="q.quiz_id">
            <td>{{ q.quiz_id }}</td>
            <td>{{ q.quiz_title }}</td>
            <td>{{ q.questions_count }}</td>
            <td>{{ q.questions_count - q.questions_added }}</td>
            <td>{{ q.difficulty_level }}</td>
            <td>{{ q.duration }}</td>
            <td>{{ q.total_score }}</td>
            <td>
              <router-link
                :to="'/admin_dashboard/quiz/' + q.quiz_id + '/view'"
                class="btn btn-sm btn-primary"
              >
                View
              </router-link>
              
              <router-link
                :to="'/admin_dashboard/quiz/edit/' + q.quiz_id"
                class="btn btn-sm btn-secondary"
              >
                Edit
              </router-link>

              <button
                @click="deleteQuiz(q.quiz_id)"
                class="btn btn-sm btn-danger"
              >
                Delete
              </button>

              <router-link
                :to="'/admin_dashboard/quiz/' + subjectId + '/quizzes/' + q.quiz_id + '/questions'"
                class="btn btn-sm btn-success"
                :class="{ disabled: (q.questions_count - q.questions_added) === 0 }"
                :aria-disabled="(q.questions_count - q.questions_added) === 0"
              >
                +Questions
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
};
