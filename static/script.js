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
import QuizList from './components/Admin/QuizManager.js';
import QuestionList from './components/Admin/QuestionManager.js';
import UsersList from './components/Admin/UserManager.js';

// User
import UserDashboard from './components/User/UserDashboard.js';
import UserNavbar from './components/User/UserNavbar.js';
import SubjectListUser from './components/User/SubjectList.js';
import ChapterListUser from './components/User/ChapterList.js';
import QuizListUser from './components/User/QuizList.js';
import QuizAttempt from './components/User/QuizAttempt.js';
import QuizScores from './components/User/QuizScores.js';





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
      { path: 'quiz', component: QuizList },// new route
      { path: 'add-subject', component: AddEditSubject },
      { path: 'edit-subject/:id', component: AddEditSubject },
      { path: 'subjects/:subjectId/chapters', component: ChapterList },
      { path: 'add-chapter/:subjectId', component: AddEditChapter },
      { path: 'edit-chapter/:subjectId/:chapterId', component: AddEditChapter },
      { path: 'chapters/:chapterId/quizzes', component: QuizList },
      { path: 'quizzes/:quizId/questions', component: QuestionList },
      { path: 'users', component: UsersList }

    ]
  },

  {
    path: '/user_dashboard',
    component: UserDashboard,
    children: [
      { path: '', component: SubjectListUser },
      { path: 'subjects/:subjectId/chapters', component: ChapterListUser },
      { path: 'chapters/:chapterId/quizzes', component: QuizListUser },
      { path: 'quizzes/:quizId/attempt', component: QuizAttempt },
      { path: 'scores', component: QuizScores }
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
