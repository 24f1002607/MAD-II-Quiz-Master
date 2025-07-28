export default {
  data() {
    return {
      user: {
        name: '',
        email: '',
        qualification: ''
      },
      subjects: [],
      expandedSubjects: {},
      quizzesBySubject: {},
      loading: false,
      error: null
    };
  },
  created() {
    this.fetchUserDashboard();
  },
  methods: {
    authOpts() {
      return {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('token')
        }
      };
    },
    async fetchUserDashboard() {
      this.loading = true;
      try {
        const res = await fetch('/api/user/dashboard', this.authOpts());
        const data = await res.json();
        this.user = data.user;

        const chaptersBySubject = {};

        for (const subjectName of Object.keys(data.quizzes_by_subject)) {
          try {
            const chapterRes = await fetch(`/api/subject/${subjectName}/chapters`, this.authOpts());
            if (!chapterRes.ok) {
              console.warn(`Failed to fetch chapters for ${subjectName}: ${chapterRes.status}`);
              chaptersBySubject[subjectName] = {};
              continue;
            }

            const chaptersData = await chapterRes.json();
            chaptersBySubject[subjectName] = {};
            chaptersData.chapters.forEach(ch => {
              chaptersBySubject[subjectName][ch.chapter_id] = ch.chapter_name;
            });
          } catch (err) {
            console.warn(`Error fetching chapters for ${subjectName}: ${err.message}`);
            chaptersBySubject[subjectName] = {};
          }
        }

        this.subjects = Object.keys(data.quizzes_by_subject).map(subjectName => {
          const quizzes = data.quizzes_by_subject[subjectName].map(quiz => ({
            ...quiz,
            chapter_name: chaptersBySubject[subjectName][quiz.chapter_id] || 'N/A'
          }));
          return {
            subject_name: subjectName,
            quizzes
          };
        });

      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    toggleExpand(subjectName) {
      this.$set(this.expandedSubjects, subjectName, !this.expandedSubjects[subjectName]);
    },
    getTotalScore(difficultyLevel) {
      if (!difficultyLevel) return 0;
      switch (difficultyLevel.toLowerCase()) {
        case 'easy': return 20;
        case 'medium': return 30;
        case 'hard': return 50;
        default: return 0;
      }
    },
    startQuiz(quizId) {
      fetch(`/api/quiz/start/${quizId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('token')
        }
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to start quiz');
          return res.json();
        })
        .then(data => {
          alert(`Quiz started! Attempt ID: ${data.attempt_id}`);
        })
        .catch(err => {
          alert(`Error: ${err.message}`);
        });
    }
  },
  template: `
    <div>
      <h2>Welcome {{ user.name }}</h2>
      <p>Email: {{ user.email }}</p>
      <p>Qualification: {{ user.qualification }}</p>

      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Subject Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="subject in subjects" :key="subject.subject_name">
            <tr>
              <td>{{ subject.subject_name }}</td>
              <td>
                <button
                  class="btn btn-sm btn-primary"
                  @click="toggleExpand(subject.subject_name)"
                >
                  {{ expandedSubjects[subject.subject_name] ? 'Hide Quizzes' : 'View Quizzes' }}
                </button>
              </td>
            </tr>

            <tr v-if="expandedSubjects[subject.subject_name]">
              <td colspan="2">
                <table class="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>Quiz ID</th>
                      <th>Chapter</th>
                      <th>No. of Questions</th>
                      <th>Difficulty Level</th>
                      <th>Total Score</th>
                      <th>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="subject.quizzes.length === 0">
                      <td colspan="8" class="text-center">No quizzes available.</td>
                    </tr>
                    <tr v-for="quiz in subject.quizzes" :key="quiz.quiz_id">
                      <td>{{ quiz.quiz_id }}</td>
                      <td>{{ quiz.chapter_name || 'N/A' }}</td>
                      <td>{{ quiz.questions_count }}</td>
                      <td>{{ quiz.difficulty_level }}</td>
                      <td>{{ getTotalScore(quiz.difficulty_level) }}</td>
                      <td>{{ quiz.duration }}</td>
                      <td>
                        <button
                          class="btn btn-sm btn-success"
                          @click="startQuiz(quiz.quiz_id)"
                        >
                          Start
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <div v-if="loading">Loading...</div>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
    </div>
  `
};
