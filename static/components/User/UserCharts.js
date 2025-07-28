export default {
  name: 'UserCharts',
  data() {
    return {
      chart: null,
      subjectScores: [], // [{ subject, average_score, attempts }]
    };
  },
  mounted() {
    this.fetchSubjectScores();
  },
  methods: {
    fetchSubjectScores() {
      fetch('/api/user/subject_scores', {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('token')
        }
      })
        .then(res => res.json())
        .then(data => {
          this.subjectScores = data;
          this.renderChart();
        })
        .catch(err => {
          console.error("Failed to load subject scores", err);
        });
    },
    renderChart() {
      const labels = this.subjectScores.map(s => s.subject);
      const averageScores = this.subjectScores.map(s => s.average_score);
      const attempts = this.subjectScores.map(s => s.attempts);

      const ctx = this.$refs.canvas.getContext('2d');

      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Average Score',
              data: averageScores,
              backgroundColor: '#007bff',
              yAxisID: 'y-score'
            },
            {
              label: 'Number of Attempts',
              data: attempts,
              backgroundColor: '#28a745',
              yAxisID: 'y-attempts'
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            'y-score': {
              type: 'linear',
              position: 'left',
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Average Score (%)'
              }
            },
            'y-attempts': {
              type: 'linear',
              position: 'right',
              beginAtZero: true,
              grid: {
                drawOnChartArea: false // avoid grid lines overlap
              },
              title: {
                display: true,
                text: 'Number of Attempts'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Subjects'
              }
            }
          }
        }
      });
    }
  },
  template: `
    <div>
      <h5>Subject-wise Performance</h5>
      <canvas ref="canvas" width="600" height="300"></canvas>
    </div>
  `
};
