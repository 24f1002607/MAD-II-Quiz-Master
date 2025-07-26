export default {
  data(){return{users:[]};},
  created(){this.load();},
  methods:{
    load(){fetch('/api/admin-dashboard', this.authOpts()).then(r=>r.json()).then(r=>this.users=r.users);},
    toggle(user){const action = user.active ? 'block':'unblock'; fetch(`/api/user/${action}/${user.id}`, {...this.authOpts(), method:'POST'}).then(()=>this.load());},
    authOpts(){return{headers:{'Content-Type':'application/json','Authentication-Token':localStorage.token}};}
  },
  template: `
    <div>
      <h3>Users</h3>
      <table class="table">
        <tr><th>ID</th><th>Username</th><th>Email</th><th>Status</th><th>Action</th></tr>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.id }}</td><td>{{ u.username }}</td><td>{{ u.email }}</td>
          <td>{{ u.active?'Active':'Blocked' }}</td>
          <td><button @click="toggle(u)" class="btn btn-sm" :class="u.active?'btn-danger':'btn-success'">
            {{ u.active?'Block':'Unblock' }}
          </button></td>
        </tr>
      </table>
    </div>`
};
