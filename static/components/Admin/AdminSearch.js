export default {
  template: `
    <div class="container mt-4">
      <h2>Admin Search</h2>
      <form @submit.prevent="handleSearch" class="form-inline mb-3">
        <input type="text" v-model="searchTerm" class="form-control mr-2" placeholder="Search term" />
        <select v-model="selectedType" class="form-control mr-2">
          <option value="subject">Subject</option>
          <option value="quiz">Quiz</option>
          <option value="user">User</option>
        </select>
        <button class="btn btn-primary" type="submit">Search</button>
      </form>

      <div v-if="selectedType === 'subject'" v-for="subject in results.subjects" :key="subject.id" class="card mb-2">
        <div class="card-body">
          <h5 class="card-title">{{ subject.name }}</h5>
          <p>ID: {{ subject.id }} | Level: {{ subject.level }} | Created At: {{ subject.created_at }}</p>
          <p>Chapters: {{ subject.chapters.join(', ') }}</p>
          <p>No. of Quizzes: {{ subject.quiz_count }}</p>
        </div>
      </div>

      <div v-if="selectedType === 'quiz'" v-for="quiz in results.quizzes" :key="quiz.id" class="card mb-2">
        <div class="card-body">
          <h5 class="card-title">{{ quiz.title }}</h5>
          <p>ID: {{ quiz.id }} | Difficulty: {{ quiz.difficulty }} | Score: {{ quiz.total_score }} | Questions: {{ quiz.question_count }}</p>
        </div>
      </div>

      <div v-if="selectedType === 'user'" v-for="user in results.users" :key="user.id" class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">{{ user.username }}</h5>
          <p>Email: {{ user.email }} | Qualification: {{ user.qualification }}</p>

          <div v-if="user.attempts && user.attempts.length">
            <h6 class="mt-3">Completed Quiz Attempts:</h6>
            <table class="table table-sm table-bordered mt-2">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>Attempt Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(attempt, index) in user.attempts" :key="index">
                  <td>{{ attempt.quiz_title }}</td>
                  <td>{{ attempt.subject }}</td>
                  <td>{{ attempt.score }}</td>
                  <td>{{ attempt.attempt_date }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-muted">No completed quiz attempts.</p>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      searchTerm: '',
      selectedType: 'subject',
      results: {
        users: [],
        quizzes: [],
        subjects: []
      }
    };
  },
  methods: {
    async handleSearch() {
      try {
        const response = await fetch(`/api/admin/search?q=${this.searchTerm}&type=${this.selectedType}`, {
          headers: {
            'Authentication-Token': localStorage.getItem('token')
          }
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        this.results = await response.json();
      } catch (err) {
        console.error("Error during search:", err);
      }
    }
  }
};
