export default {
  props: ['chapterId'],
  data() {
    return {
      quizzes: [],
      form: {
        quiz_title: '',
        quiz_date: '',
        duration: '',
        difficulty_level: '',
        questions_count: 0
      },
      isEdit: false
    };
  },
  created() {
    this.load();
  },
  methods: {
    load() {
      fetch('/api/admin-dashboard', this.authOpts())
        .then(r => r.json())
        .then(r => this.quizzes = r.quizzes);
    },
    save() {
      const payload = { ...this.form, chapter_id: this.chapterId };
      const method = this.isEdit ? 'PUT' : 'POST';
      const url = this.isEdit ? `/api/quiz/${this.form.quiz_id}` : '/api/quiz';
      fetch(url, {
        ...this.authOpts(),
        method,
        body: JSON.stringify(payload)
      }).then(() => {
        this.reset();
        this.load();
      });
    },
    edit(q) {
      this.form = { ...q };
      this.isEdit = true;
    },
    remove(quiz_id) {
      fetch(`/api/quiz/${quiz_id}`, {
        ...this.authOpts(),
        method: 'DELETE'
      }).then(() => this.load());
    },
    reset() {
      this.form = {
        quiz_title: '',
        quiz_date: '',
        duration: '',
        difficulty_level: '',
        questions_count: 0
      };
      this.isEdit = false;
    },
    authOpts() {
      return {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.token
        }
      };
    }
  },
  template: `
    <div>
      <h3>Quizzes</h3>
      <ul class="list-group">
        <li v-for="q in quizzes" :key="q.quiz_id" class="list-group-item">
          {{ q.quiz_title }} ({{ q.difficulty_level }})
          <button @click="edit(q)" class="btn btn-sm btn-warning float-right ml-2">Edit</button>
          <button @click="remove(q.quiz_id)" class="btn btn-sm btn-danger float-right">Delete</button>
        </li>
      </ul>
      <div class="mt-3">
        <input v-model="form.quiz_title" placeholder="Quiz Title" class="form-control mb-2"/>
        <input v-model="form.quiz_date" placeholder="YYYY-MM-DD" class="form-control mb-2"/>
        <input v-model="form.duration" placeholder="HH:MM" class="form-control mb-2"/>
        <select v-model="form.difficulty_level" class="form-control mb-2">
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <input v-model.number="form.questions_count" type="number" placeholder="Questions Count" class="form-control mb-2"/>
        <button @click="save" class="btn btn-primary">{{ isEdit ? 'Update' : 'Add Quiz' }}</button>
      </div>
    </div>
  `
};
