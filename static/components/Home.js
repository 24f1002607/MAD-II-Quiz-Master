export default {
    template: `
    <div class="hero-section d-flex align-items-center justify-content-center">
        <div class="container text-center text-white">
            
            <!-- Heading -->
            <h1 class="hero-title mb-3">Welcome to Quiz Whiz</h1>
            
            <!-- Subheading -->
            <p class="lead mb-3" style="font-size: 1.5rem; color: black; font-weight: bold;">
                Tease your brains anytime, anywhere.
            </p>
            
            <!-- Cartoon Image -->
            <img src="/static/Images/braincartoon.jpeg"
                 class="img-fluid mb-4"
                 alt="Brain Cartoon"
                 style="max-height: 180px; width: auto;">
            
            <!-- Buttons -->
            <div class="d-flex justify-content-center gap-3">
                <router-link to="/login" class="btn btn-warning btn-lg">Login</router-link>
                <router-link to="/register" class="btn btn-success btn-lg">Get Started</router-link>
            </div>
        </div>
    </div>
    `,

    mounted() {
        document.body.style.margin = "0";  // Remove default margin
        document.body.style.background = "none";  // Let hero-section's background dominate
    }
};
