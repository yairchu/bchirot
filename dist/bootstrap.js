import('./app.js').catch(error => {
  console.error('Questionnaire startup failed:', error);
  const app = document.querySelector('#app');
  app.innerHTML = `<section class="screen" aria-labelledby="question-title" role="alert">
    <h1 id="question-title">השאלון לא הצליח להיטען.</h1>
    <p class="description">אפשר לנסות לרענן את העמוד.</p>
    <button class="primary" id="retry-loading">לנסות שוב</button>
    <details class="source-note"><summary>פרטי התקלה</summary><pre dir="ltr"></pre></details>
  </section>`;
  app.querySelector('pre').textContent = String(error);
  app.querySelector('#retry-loading').addEventListener('click', () => window.location.reload());
});
