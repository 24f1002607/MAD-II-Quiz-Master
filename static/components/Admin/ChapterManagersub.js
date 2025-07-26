export default {
  props: ['subjectId'],
  data() {
    return {
      chapters: [],
      subjectId: this.$route.params.subjectId
    };
  },
  created() {
    console.log('Received subjectId:', this.subjectId); //optional debug log
    this.load();
  },
  beforeRouteUpdate(to, from, next) {
    this.subjectId = to.params.subjectId;
    this.load();
    next();
  },
  methods: {
    load() {
      fetch(`/api/chapter?subject_id=${this.subjectId}`, this.authOpts())
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          this.chapters = data;
        })
        .catch(error => {
          console.error('Error loading chapters:', error);
        });
    },
    remove(id) {
      fetch(`/api/chapter/${id}`, {
        ...this.authOpts(),
        method: 'DELETE'
      }).then(() => this.load());
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
    <div class="bg-light p-3">
      <table class="table table-sm">
        <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="c in chapters" :key="c.chapter_id">
            <td>{{ c.chapter_id }}</td>
            <td>{{ c.chapter_name }}</td>
            <td>{{ c.chapter_description }}</td>
            <td>
              <router-link :to="'/admin_dashboard/edit-chapter/' + subjectId + '/' + c.chapter_id" class="btn btn-sm btn-warning">Edit</router-link>
              <button @click="remove(c.chapter_id)" class="btn btn-sm btn-danger">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <router-link :to="'/admin_dashboard/add-chapter/' + subjectId" class="btn btn-sm btn-success">+ Chapter</router-link>
    </div>
  `
};
