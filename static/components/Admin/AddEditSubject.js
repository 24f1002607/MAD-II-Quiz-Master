export default {
  data() {
    return {
      form: { subject_name: '', level: '' },
      isEdit: false,
    };
  },
  created() {
    const id = this.$route.params.id;
    if (id) {
      this.isEdit = true;
      fetch(`/api/subject/${id}`, this.authOpts())
        .then(r => r.json())
        .then(r => {
          this.form = r.subject;
        });
    }
  },
  methods: {
    save() {
      const method = this.isEdit ? 'PUT' : 'POST';
      const url = this.isEdit ? `/api/subject/${this.$route.params.id}` : '/api/subject';
      fetch(url, {
        ...this.authOpts(),
        method,
        body: JSON.stringify(this.form)
      }).then(() => {
        this.$router.push('/admin_dashboard');
      });
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
      <h3>{{ isEdit ? 'Edit Subject' : 'Add Subject' }}</h3>
      <div class="form-group">
        <label>Subject Name</label>
        <input v-model="form.subject_name" class="form-control" placeholder="Enter subject name" />
      </div>
      <div class="form-group">
        <label>Level</label>
        <select v-model="form.level" class="form-control">
          <option disabled value="">Select Level</option>
          <option>Foundation</option>
          <option>Diploma Data Science</option>
          <option>Diploma Programming</option>
          <option>Degree BSc</option>
          <option>Degree BS</option>
        </select>
      </div>
      <button @click="save" class="btn btn-success mt-2">{{ isEdit ? 'Update' : 'Create' }}</button>
    </div>
  `
};
