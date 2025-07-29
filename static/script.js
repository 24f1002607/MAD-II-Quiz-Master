Vue.use(VueRouter);

// Import components
import Login from './components/Common/Login.js';
import Register from './components/Common/Register.js';
import Home from './components/Home.js';
import Footer from './components/Common/Footer.js';

// Admin
import AdminDashboard from './components/Admin/AdminDashboard.js';
import AdminNavbar from './components/Admin/AdminNavbar.js';
import SubjectList from './components/Admin/SubjectManager.js';
import AddEditSubject from './components/Admin/AddEditSubject.js';
import AddEditChapter from './components/Admin/AddEditChapter.js';
import ChapterList from './components/Admin/ChapterManagersub.js';
import QuizList from './components/Admin/QuizManager.js'; // Quiz landing page
import QuizListBySubject from './components/Admin/AvailableQuizList.js'; // New component for quizzes of a subject
import AddQuestions from './components/Admin/AddQuestions.js';
import EditQuizForm from './components/Admin/EditQuizForm.js';
import ViewQuiz from './components/Admin/ViewQuiz.js';
import EditQuestion from './components/Admin/EditQuestion.js';
import UsersList from './components/Admin/UserManager.js';
import AdminCharts from './components/Admin/AdminCharts.js';
import AdminSearch from './components/Admin/AdminSearch.js';


// User
import UserDashboard from './components/User/UserDashboard.js';
import UserNavbar from './components/User/UserNavbar.js';
import SubjectListUser from './components/User/SubjectListUser.js';
import ViewQuizUser from './components/User/ViewQuizUser.js';
import QuizListUser from './components/User/QuizList.js';
import QuizAttempt from './components/User/QuizAttempt.js';
import QuizScores from './components/User/QuizScores.js';
import QuizScoresHistory from './components/User/QuizScoresHistory.js';
import UserCharts from './components/User/UserCharts.js';

// Define routes
const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },

  {
    path: '/admin_dashboard',
    component: AdminDashboard,
    children: [
      { path: '', component: SubjectList },
      {
        path: 'quiz',
        component: QuizList,   // QuizManager.js - quiz landing page
        children: [
          {
            path: ':subjectId/quizzes',
            component: QuizListBySubject, // Shows quizzes for specific subject
            props: true
          }
        ]
      },
      { path: 'add-subject', component: AddEditSubject },
      { path: 'edit-subject/:id', component: AddEditSubject },
      { path: 'subjects/:subjectId/chapters', component: ChapterList },
      { path: 'add-chapter/:subjectId', component: AddEditChapter },
      { path: 'edit-chapter/:subjectId/:chapterId', component: AddEditChapter },
      {
        path: 'quiz/:subjectId/quizzes/:quizId/questions',
        component: AddQuestions,
        props: route => ({
          subjectId: Number(route.params.subjectId),
          quizId: Number(route.params.quizId)
        })
      },

      { path: 'quiz/edit/:quizId', component: EditQuizForm, props: true },
      { path: 'quiz/:quizId/view', component: ViewQuiz, props: true },
      { path: 'quizzes/:quizId/questions/:questionId/edit', component: EditQuestion, props: true },
      { path: 'users', component: UsersList },
      { path: 'analytics', component: AdminCharts },
      { path: 'search', component: AdminSearch },

    ]
  },

  {
    path: '/user_dashboard',
    component: UserDashboard,
    children: [
      { path: '', component: SubjectListUser },
      { path: 'quizzes/:quizId/view', component: ViewQuizUser, props: true },
      { path: 'chapters/:chapterId/quizzes', component: QuizListUser },
      { path: 'quiz/:quizId/attempt', component: QuizAttempt, props: true },
      { path: 'scores', component: QuizScoresHistory },
      { path: 'quiz_result/:attemptId', component: QuizScores, props: true },
      { path: 'charts', component: UserCharts }
    ]
  }
];

const router = new VueRouter({
  mode: 'history',
  routes
});

// Navigation Guard (simple role-based control)
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');

  // Allow public routes
  const publicPaths = ['/', '/login', '/register'];
  if (publicPaths.includes(to.path)) {
    return next();
  }

  // Block unauthenticated users
  if (!token) {
    return next('/login');
  }

  // Role-based access
  if (to.path.startsWith('/admin_dashboard') && !roles.includes('admin')) {
    return next('/user_dashboard');
  }

  if (to.path.startsWith('/user_dashboard') && !roles.includes('user') && !roles.includes('admin')) {
    return next('/');
  }

  next();
});

// Root Vue instance
new Vue({
  el: '#app',
  router,
  template: `
    <div class="d-flex flex-column min-vh-100">
      <admin-navbar v-if="isAdminPage"></admin-navbar>
      <user-navbar v-else-if="isUserPage"></user-navbar>

      <div class="flex-fill container mt-4">
        <router-view></router-view>
      </div>

      <footer-bar v-if="isAdminPage || isUserPage"></footer-bar>
    </div>
  `,
  computed: {
    isAdminPage() {
      return this.$route.path.startsWith('/admin_dashboard');
    },
    isUserPage() {
      return this.$route.path.startsWith('/user_dashboard');
    }
  },
  components: {
    'admin-navbar': AdminNavbar,
    'user-navbar': UserNavbar,
    'footer-bar': Footer
  }
});
