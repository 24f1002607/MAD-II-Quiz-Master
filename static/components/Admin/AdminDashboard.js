
import SubjectManager from './SubjectManager.js';
import ChapterManager from './ChapterManagersub.js';
import QuizManager from './QuizManager.js';
import QuestionManager from './QuestionManager.js';
import UserManager from './UserManager.js';
import AdminSearch from './AdminSearch.js';
import AdminCharts from './AdminCharts.js';
import AdminNavbar from './AdminNavbar.js';
import ViewQuiz from './ViewQuiz.js';

export default {
  components: {
    SubjectManager, ChapterManager, QuizManager,
    QuestionManager, UserManager, AdminSearch, AdminCharts, AdminNavbar, ViewQuiz
  },
  template: `
    <div>
      
      <div class="container mt-4">
        <router-view></router-view>
      </div>
    </div>`
};


