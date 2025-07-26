export default {
  data(){return{query:'', users:[], subjects:[], quizzes:[]};},
  methods:{
    search(){
      fetch('/api/admin/search?q='+encodeURIComponent(this.query), this.authOpts())
        .then(r=>r.json()).then(r=>{this.users=r.users;this.subjects=r.subjects;this.quizzes=r.quizzes;});
    },
    authOpts(){return{headers:{'Authentication-Token':localStorage.token}};}
  },
  template: `
    <div>
      <h3>Search</h3>
      <div class="mb-3">
        <input v-model="query" placeholder="Search..." class="form-control d-inline-block w-75"/>
        <button @click="search" class="btn btn-primary">Go</button>
      </div>
      <div>
        <h5>Users</h5><ul><li v-for="u in users" :key="u.id">{{u.username}}</li></ul>
        <h5>Subjects</h5><ul><li v-for="s in subjects" :key="s.id">{{s.name}}</li></ul>
        <h5>Quizzes</h5><ul><li v-for="q in quizzes" :key="q.id">{{q.title}}</li></ul>
      </div>
    </div>`
};
