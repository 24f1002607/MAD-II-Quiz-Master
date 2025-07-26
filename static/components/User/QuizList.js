export default {
  props: ['chapterId'],
  data() {
    return {
      quizzes: []
    };
  },
  created() {
    fetch(`/api/quiz?chapter_id=${this.chapterId}`, this.authOpts())
      .then(res => res.json())
      .then(data => this.quizzes = data.quizzes);
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
      <h3>Quizzes</h3>
      <ul class="list-group">
        <li v-for="q in quizzes" :key="q.quiz_id" class="list-group-item">
          <router-link :to="'/user_dashboard/quizzes/' + q.quiz_id + '/attempt'">
            {{ q.quiz_title }} ({{ q.difficulty_level }}) – Scheduled: {{ q.quiz_date.split('T')[0] }}
          </router-link>
        </li>
      </ul>
    </div>
  `
};
