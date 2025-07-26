export default {
  data() {
    return {
      subjects: []
    };
  },
  created() {
    fetch('/api/subject', this.authOpts())
      .then(res => res.json())
      .then(data => this.subjects = data.subjects);
  },
  methods: {
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
      <h2>Available Subjects</h2>
      <ul class="list-group">
        <li v-for="s in subjects" :key="s.subject_id" class="list-group-item">
          <router-link :to="'/user_dashboard/subjects/' + s.subject_id + '/chapters'">
            {{ s.subject_name }} ({{ s.level }})
          </router-link>
        </li>
      </ul>
    </div>
  `
};
