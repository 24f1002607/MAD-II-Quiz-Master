export default {
  props: ['subjectId'],
  data() {
    return {
      chapters: []
    };
  },
  created() {
    fetch(`/api/chapter?subject_id=${this.subjectId}`, this.authOpts())
      .then(res => res.json())
      .then(data => this.chapters = data.chapters);
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
      <h3>Chapters</h3>
      <ul class="list-group">
        <li v-for="c in chapters" :key="c.chapter_id" class="list-group-item">
          <router-link :to="'/user_dashboard/chapters/' + c.chapter_id + '/quizzes'">
            {{ c.chapter_name }}
          </router-link>
        </li>
      </ul>
    </div>
  `
};
