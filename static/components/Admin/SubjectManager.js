import ChapterManagerSub from './ChapterManagersub.js';

export default {
  components: { ChapterManagerSub },
  data() {
    return {
      subjects: [],
      expandedSubjectId: null,
    };
  },
  created() {
    this.load();
    const expandId = this.$route.query.expand;
    if (expandId) {
      this.expandedSubjectId = parseInt(expandId); //ensure its a number
      //Cleanup
      this.$router.replace({ path: '/admin_dashboard' });
    }
  },
  methods: {
    load() {
      fetch('/api/subject', this.authOpts())
        .then(r => {
          if (!r.ok) throw new Error("Unauthorized or bad response");
          return r.json();
        })
        .then(data => {
          this.subjects = data.subjects;
        })
        .catch(err => {
          console.error("Failed to load subjects:", err);
          alert("Failed to load subjects. Please log in again.");
          this.$router.push("/login");
        });
    },
    

    toggleDetails(id) {
      this.expandedSubjectId = this.expandedSubjectId === id ? null : id;
    },

    remove(subject_id) {
      if (!confirm("Are you sure you want to delete this subject?")) return;

      fetch(`/api/subject/${subject_id}`, {
        ...this.authOpts(),
        method: 'DELETE',
      })
        .then(res => {
          if (!res.ok) {
            throw new Error("Delete failed");
          }
          this.load();
        })
        .catch(err => {
          console.error("Delete error:", err);
          alert("Failed to delete subject.");
        });
    },

    authOpts() {
      const token = localStorage.getItem('token');
      console.log("Using token:", token);
      return {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': token
        }
      };
    }
  },

  template: `
    <div>
      <h3>Subjects</h3>

      <router-link to="/admin_dashboard/add-subject" class="btn btn-primary mb-3">+ Add Subject</router-link>

      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Level</th>
            <th>Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="s in subjects" :key="s.subject_id">
            <tr>
              <td>{{ s.subject_id }}</td>
              <td>{{ s.subject_name }}</td>
              <td>{{ s.level }}</td>
              <td>
                <button @click="toggleDetails(s.subject_id)" class="btn btn-sm btn-info">
                  {{ expandedSubjectId === s.subject_id ? 'Hide' : 'View' }} Chapters
                </button>
              </td>
              <td>
                <router-link :to="'/admin_dashboard/edit-subject/' + s.subject_id" class="btn btn-sm btn-warning">
                  Edit
                </router-link>
                <button @click="remove(s.subject_id)" class="btn btn-sm btn-danger">Delete</button>
              </td>
            </tr>

            <tr v-if="expandedSubjectId === s.subject_id">
              <td colspan="5" class="bg-light">
                <ChapterManagerSub :subjectId="s.subject_id" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  `
};
