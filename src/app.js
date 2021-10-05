import * as CS from './constants.js'
import { readFromStorage, writeToStorage } from './storage.js'

(() => {

  const app = {

    async init () {
      this.filters = readFromStorage("filters") || CS.defaultLimit;

      this.cacheElements();
      this.registerListeners();
      this.showFilters();

      this.questions = readFromStorage("questions") || [];
      this.activeQuestion = null;
      this.activeQuestionId = null;
      this.counter = null;
    },

    cacheElements () {
      this.$filters = document.querySelector("#filters");
      this.$questions = document.querySelector("#questions");
      this.$results = document.querySelector("#results");

      this.$form = document.querySelector("form");
      this.$formSelectCategory = document.querySelector("form #category");
      this.$formSelectDifficulty = document.querySelector("form #difficulty");
      this.$formInputLimit = document.querySelector("form #limit");
      this.$formValueLimit = document.querySelector("form #limit_value");
    },

    registerListeners () {
      // form listeners
      this.$form.addEventListener("submit", (e) => {
        e.preventDefault();
  
        const formData = new FormData(this.$form);
  
        this.filters = {
          category: formData.get("category"),
          difficulty: formData.get("difficulty"),
          limit: formData.get("limit"),
        };
        
        writeToStorage("filters", this.filters);
        this.fetchQuestions();

        this.$filters.classList.add("hide");
        this.$questions.classList.remove("hide");
      });

      // real time updating of the slider limit
      this.$formInputLimit.addEventListener("input", (e) => {
      this.$formValueLimit.innerHTML = e.target.value;
      });

      // question listeners
      this.$questions.addEventListener("click", (e) => {
        e.preventDefault();

        // when clicking on the next button 
        if (e.target.id == "next" ) {

          // look for the answer buttons with an active class
          this.$buttons = document.querySelectorAll('button.active');
          let selectedAnswer = '';
          for (const btn of this.$buttons) {
            if (btn.classList.contains('active')) selectedAnswer = btn.dataset.name;
          }

          for (const key in this.activeQuestion.correct_answers) {
            if ((this.activeQuestion.correct_answers[key] === "true") && key === `${selectedAnswer}_correct`) {
              this.score++;
            }
          };
          this.nextQuestion();

        } else if (e.target.id == "skip" ) {
          this.nextQuestion();
        }

        if (e.target.id == "stop") {
          clearInterval(this.timer);
          this.$questions.classList.add("hide");
          this.$filters.classList.remove("hide");
          document.querySelector('h1').innerHTML = 'Quiz Time!';
        }
      
        if (e.target.dataset.name) {
          document.querySelector(`article[data-id="${this.activeQuestionId}"] .${e.target.dataset.name}`).classList.toggle('active');
        }
      });

      // results listeners
      this.$results.addEventListener("click", (e) => {
        if (e.target.id == "restart") {
          clearInterval(this.timer);
          this.$results.classList.add("hide");
          this.$filters.classList.remove("hide");
          document.querySelector('h1').innerHTML = 'Quiz Time!';
        };
      });
    },

    showFilters () {
      // add categories to select
      const selectCategories = CS.categories.map((category) => {
        return `<option ${category == this.filters.category ? "selected" : ""} value="${category}">${category}</option>`;
      });
      this.$formSelectCategory.innerHTML = selectCategories.join("\n");

      // add difficulties to select
      const selectDifficulties = CS.difficulties.map((difficulty) => {
        return `<option ${difficulty == this.filters.difficulty ? "selected" : ""} value="${difficulty}">${difficulty}</option>`;
      });
      this.$formSelectDifficulty.innerHTML = selectDifficulties.join("\n");

      // max amount
      this.$formInputLimit.setAttribute("min", CS.amountOfQuestions.min);
      this.$formInputLimit.setAttribute("max", CS.amountOfQuestions.max);
      this.$formInputLimit.value = this.filters.limit;
      this.$formValueLimit.innerHTML = this.filters.limit;
    },

    async fetchQuestions () {
      const response = await fetch(`${CS.QUIZ_API}?apiKey=${CS.API_KEY}&category=${this.filters.category}&difficulty=${this.filters.difficulty}&limit=${this.filters.limit}`);
      this.questions = await response.json();
      
      // write the fetched questions to the local storage
      writeToStorage("questions", this.questions);

      this.showQuestions();
      document.querySelector('h1').innerHTML = `${this.filters.category}`;
    },

    showQuestions() {
      console.log(this.questions);
      this.score = 0;

      // show the heading and number of questions
      this.$questions.innerHTML = `
      <div class="top-part">
        <h2>Question <span id="counter">1</span>/${this.questions.length}</h2>
        <progress value="150" max="150" id="timer"></progress>
      </div>
      `

      // iterate through every question
      for (const [index, question] of this.questions.entries()) {


        if (index == 0) {
        this.activeQuestion = question;
        this.activeQuestionId = question.id;
        this.counter = 1;
        }

        // iterate through the answers
        const showAnswers = () => {
          let tempStr = '';
          for (const key in question.answers) {
            const answer = question.answers[key];

            // check how many answers there are per question
            if(answer != null) { 
              tempStr += `<li>
                <button class="answer-btn ${key}" data-name="${key}">${answer}</button>
              </li>`;
            };
          };
          return tempStr;
        }

        // show the question
        const questionHTML = `
        <article data-id="${question.id}" class="${question.id != this.activeQuestionId ? "hide" : ""} question">
          <h2>${question.question}</h2>
          <ul>
            ${showAnswers()}
          </ul>
        </article>
        `;

        // show the buttons
        this.$questions.innerHTML += questionHTML;
      };

      this.$questions.innerHTML += `
      <div id="q-btn">
        <button id="next">Next</button>
        <button id="skip">Skip</button>
        <button id="stop">Stop</button>
      </div>`;

      // aaaand.. start the timer
      this.setQuizTimer();
    },

    nextQuestion () {
      // get the next active question
      this.nextActiveQuestion = this.questions.find((question, index) => {

        // if the previous question is the current question…
        // then this question will be the next one we want to show
        if (this.questions[index - 1] && this.activeQuestionId == this.questions[index - 1].id) {
          return true;
        }
        });

        if (this.nextActiveQuestion) {
        // set new active question id
        this.activeQuestion = this.nextActiveQuestion;
        this.activeQuestionId = this.nextActiveQuestion.id;
        this.counter++;
        
        // restart the timer for each question
        clearInterval(this.timer);
        this.setQuizTimer();

        // toggle visible question
        document.querySelector(".question:not(.hide)").classList.add("hide"); 
        document.querySelector(`.question[data-id="${this.activeQuestionId}"]`).classList.remove("hide"); 
        document.querySelector("span#counter").innerHTML = this.counter; 
        } else {
          // show the results after the last question
          clearInterval(this.timer);
          this.showResults();
          this.$questions.classList.add("hide");
          this.$results.classList.remove("hide");
          document.querySelector('h1').innerHTML = 'Results';
        };
      },

    setQuizTimer () {
      // set the start time of 15s
      // or 150ms to make the progress smoother
      this.time = 150;
      this.timer = setInterval(() => {

        // start the countdown
        this.time--;
        document.querySelector('#timer').value = 150 - this.time;

        // when the time hits zero
        if (this.time <= 0) {
          clearInterval(this.timer);
          this.nextQuestion();
          this.wrongAnswers++;
        }
      }, 100);
    },

    showResults () {
      this.$results.innerHTML = `
      <div>
        <h2>Let's check your score...</h2>
        <img src="/src/img/trophy.png">
        
        <p id="score">You scored <span id="highlight">${Math.floor(this.score / this.questions.length * 100)}%</span></p>
        <p>Correct answers: <span id="highlight">${this.score}</span></p>
        <p>Wrong answers: <span id="highlight">${this.questions.length - this.score}</span></p>
        
        <button id="restart">Start Over</button>
      </div>`
    },

  };

  app.init();

})();