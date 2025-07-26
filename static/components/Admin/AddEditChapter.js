export default {
  data() {
    return {
      form: { chapter_name: '', description: '' },
      isEdit: false,
      subjectId: null
    };
  },
  created() {
    const { subjectId, chapterId } = this.$route.params;
    this.subjectId = subjectId;

    if (chapterId) {
      this.isEdit = true;
      fetch(`/api/chapter/${chapterId}`, this.authOpts())
        .then(async r => {
          if (!r.ok) throw new Error(await r.text());
          const data = await r.json();
          this.form.chapter_name = data.chapter.chapter_name;
          this.form.description = data.chapter.chapter_description;
        })
        .catch(err => {
          console.error('Failed to load chapter:', err);
          alert('Failed to load chapter data.');
      });
    }
  },
  methods: {
    save() {
      const url = this.isEdit
        ? `/api/chapter/${this.$route.params.chapterId}`
        : '/api/chapter';
      const method = this.isEdit ? 'PUT' : 'POST';
      
      // Include subjectId in payload to link chapter to correct subject
      const payload = { subject_id: this.subjectId, ...this.form };

      fetch(url, {
        ...this.authOpts(),
        method,
        body: JSON.stringify(payload)
      })
        .then(r => {
          if (!r.ok) throw new Error('Request failed');
          return r.json();
        })
        .then(() => {
          // Redirect back to subject chapters list and expand subject row
          this.$router.push({ 
            path: `/admin_dashboard`, 
            query: { expand: this.subjectId } 
          });
        })
        .catch(err => {
          console.error(err);
          alert('Failed to save chapter. Are you logged in as admin?');
        });
    },
    authOpts() {
      return {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('token')
        }
      };
    }
  },
  template: `
    <div>
      <h3>{{ isEdit ? 'Edit Chapter' : 'Add Chapter' }}</h3>
      <div class="mb-2">
        <label>Name</label>
        <input v-model="form.chapter_name" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Description</label>
        <input v-model="form.description" class="form-control" />
      </div>
      <button @click="save" class="btn btn-success">
        {{ isEdit ? 'Update' : 'Add' }}
      </button>
    </div>
  `
};
