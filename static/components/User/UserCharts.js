export default {
  props: ['scores'],
  template: `
    <div>
      <h3>Score Summary</h3>
      <table class="table">
        <thead><tr><th>Quiz ID</th><th>Score</th><th>Date</th></tr></thead>
        <tbody>
          <tr v-for="s in scores" :key="s.quiz_id">
            <td>{{ s.quiz_id }}</td><td>{{ s.score }}</td><td>{{ s.attempt_date.split('T')[0] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
};
