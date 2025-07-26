export default {
  data() {
    return {
      scores: []
    };
  },
  created() {
    fetch('/api/quiz/results', this.authOpts())
      .then(res => res.json())
      .then(data => this.scores = data);
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
      <h3>Your Scores</h3>
      <ul class="list-group">
        <li v-for="s in scores" :key="s.quiz_id" class="list-group-item">
          Quiz ID: {{ s.quiz_id }} — Score: {{ s.score }} — Date: {{ s.attempt_date.split('T')[0] }}
        </li>
      </ul>
    </div>
  `
};
