export default {
  props: ['quizId', 'chapterId'],
  data() {
    return {
      questions: [],
      form: {
        question_text: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_answer: 1,
        marks: 1
      },
      isEdit: false
    };
  },
  created() {
    this.load();
  },
  methods: {
    load() {
      fetch(`/api/quiz/view/${this.quizId}`, this.authOpts())
        .then(r => r.json())
        .then(r => this.questions = r.questions);
    },
    save() {
      const payload = {
        ...this.form,
        quiz_id: this.quizId,
        chapter_id: this.chapterId
      };
      const method = this.isEdit ? 'PUT' : 'POST';
      const url = this.isEdit ? `/api/question/${this.form.question_id}` : '/api/question';
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
    remove(id) {
      fetch(`/api/question/${id}`, {
        ...this.authOpts(),
        method: 'DELETE'
      }).then(() => this.load());
    },
    reset() {
      this.form = {
        question_text: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_answer: 1,
        marks: 1
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
      <h3>Questions</h3>
      <ul class="list-group">
        <li v-for="q in questions" :key="q.question_id" class="list-group-item">
          {{ q.text }}
          <button @click="edit(q)" class="btn btn-sm btn-warning float-right ml-2">Edit</button>
          <button @click="remove(q.question_id)" class="btn btn-sm btn-danger float-right">Delete</button>
        </li>
      </ul>
      <div class="mt-3">
        <input v-model="form.question_text" placeholder="Question Text" class="form-control mb-2"/>
        <input v-model="form.option1" placeholder="Option 1" class="form-control mb-2"/>
        <input v-model="form.option2" placeholder="Option 2" class="form-control mb-2"/>
        <input v-model="form.option3" placeholder="Option 3" class="form-control mb-2"/>
        <input v-model="form.option4" placeholder="Option 4" class="form-control mb-2"/>
        <input v-model.number="form.correct_answer" type="number" placeholder="Correct Answer (1-4)" class="form-control mb-2"/>
        <input v-model.number="form.marks" type="number" placeholder="Marks" class="form-control mb-2"/>
        <button @click="save" class="btn btn-primary">{{ isEdit ? 'Update' : 'Add Question' }}</button>
      </div>
    </div>
  `
};
