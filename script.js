// API Configuration
let API_KEY =
  localStorage.getItem("lingualearn_api_key") ||
  "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";
const API_BASE_URL = "https://openrouter.io/api/v1";

// Save and load API key
function saveAPIKey() {
  const apiKeyInput = document.getElementById("apiKeyInput");
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showToast("Please enter a valid API key!");
    return;
  }

  API_KEY = apiKey;
  localStorage.setItem("lingualearn_api_key", apiKey);
  showToast("API Key saved successfully!");
  apiKeyInput.value = "";
}

function loadAPIKey() {
  const apiKeyInput = document.getElementById("apiKeyInput");
  if (apiKeyInput && API_KEY) {
    apiKeyInput.placeholder = "API Key is configured ✓";
  }
}

// Local Database using localStorage
class LocalDatabase {
  constructor() {
    this.initializeDB();
  }

  initializeDB() {
    if (!localStorage.getItem("lingualearn")) {
      localStorage.setItem(
        "lingualearn",
        JSON.stringify({
          user: {
            name: "Language Learner",
            level: 1,
            xp: 0,
            streak: 0,
            lastLessonDate: null,
            daysLearning: 0,
            lessonsCompleted: 0,
            gems: 0,
            learningGoal: "casual",
            difficulty: "beginner",
          },
          conversations: [],
          vocabulary: [],
          grammar: [],
          speaking: [],
          achievements: [],
          dailyProgress: [],
        })
      );
    }
  }

  getData() {
    return JSON.parse(localStorage.getItem("lingualearn"));
  }

  saveData(data) {
    localStorage.setItem("lingualearn", JSON.stringify(data));
  }

  updateUser(updates) {
    const data = this.getData();
    data.user = { ...data.user, ...updates };
    this.saveData(data);
  }

  addPoints(points) {
    const data = this.getData();
    data.user.xp += points;
    data.user.gems += Math.floor(points / 10);
    this.saveData(data);
  }

  addLesson() {
    const data = this.getData();
    data.user.lessonsCompleted++;
    const today = new Date().toDateString();
    if (data.user.lastLessonDate !== today) {
      data.user.lastLessonDate = today;
      data.user.daysLearning++;
      if (data.user.lastLessonDate !== today) {
        data.user.streak++;
      }
    }
    this.saveData(data);
  }
}

const db = new LocalDatabase();

// Quiz Data
const vocabularyQuestions = [
  {
    word: "Hola",
    options: ["Hello", "Goodbye", "Please", "Thank you"],
    correct: 0,
  },
  {
    word: "Gato",
    options: ["Dog", "Cat", "Bird", "Fish"],
    correct: 1,
  },
  {
    word: "Libro",
    options: ["Pen", "Book", "Table", "Chair"],
    correct: 1,
  },
  {
    word: "Agua",
    options: ["Fire", "Water", "Earth", "Air"],
    correct: 1,
  },
  {
    word: "Rápido",
    options: ["Slow", "Fast", "Big", "Small"],
    correct: 1,
  },
];

const grammarQuestions = [
  {
    question: 'Complete: "Yo ____ un estudiante."',
    options: ["soy", "somos", "sois", "son"],
    correct: 0,
  },
  {
    question: "Which is correct?",
    options: ["Tengo hambre", "Tengo rabia", "Tengo suelo", "Tengo cansado"],
    correct: 0,
  },
  {
    question: 'Translate: "She goes to school"',
    options: [
      "Ella voy a la escuela",
      "Ella va a la escuela",
      "Ella van a la escuela",
      "Ella vamos a la escuela",
    ],
    correct: 1,
  },
  {
    question: "Which article is feminine?",
    options: ["el", "la", "un", "unos"],
    correct: 1,
  },
  {
    question: 'Complete: "Nosotros ____ hambre."',
    options: ["tenemos", "tienes", "tiene", "tengo"],
    correct: 0,
  },
];

const speakingPhrases = [
  {
    phrase: "Hello, how are you?",
    translation: "Hola, ¿cómo estás?",
  },
  {
    phrase: "My name is John",
    translation: "Mi nombre es Juan",
  },
  {
    phrase: "What is your name?",
    translation: "¿Cuál es tu nombre?",
  },
  {
    phrase: "I am learning Spanish",
    translation: "Estoy aprendiendo español",
  },
  {
    phrase: "Nice to meet you",
    translation: "Mucho gusto",
  },
];

const conversationTopics = [
  "Ask about the weather today",
  "Introduce yourself",
  "Order food at a restaurant",
  "Ask for directions",
  "Talk about your hobbies",
  "Describe your family",
  "Plan a vacation",
  "Buy something at a shop",
];

// Global Quiz State
let vocabState = {
  currentQuestion: 0,
  score: 0,
  isAnswered: false,
  isActive: false,
  selectedAnswer: null,
  questions: [],
};

let grammarState = {
  currentQuestion: 0,
  score: 0,
  isAnswered: false,
  isActive: false,
  selectedAnswer: null,
  questions: [],
};

let speakingState = {
  currentPhrase: 0,
  score: 0,
  isActive: false,
  isRecording: false,
};

// Page Navigation
function switchPage(pageName) {
  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => page.classList.remove("active"));

  const page = document.getElementById(pageName);
  if (page) {
    page.classList.add("active");
  }

  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach((btn) => btn.classList.remove("active"));
  document.querySelector(`[data-page="${pageName}"]`).classList.add("active");

  // Update header
  updatePageHeader(pageName);

  // Initialize page-specific content
  if (pageName === "dashboard") {
    updateDashboard();
  }
}

function updatePageHeader(pageName) {
  const headers = {
    dashboard: {
      title: "Welcome Back!",
      subtitle: "Continue your learning journey",
    },
    conversation: {
      title: "Daily Conversation",
      subtitle: "Practice speaking with AI",
    },
    vocabulary: { title: "Vocabulary Quiz", subtitle: "Learn new words" },
    grammar: {
      title: "Grammar Challenge",
      subtitle: "Master the language rules",
    },
    speaking: {
      title: "Speaking Practice",
      subtitle: "Improve your pronunciation",
    },
    profile: { title: "Your Profile", subtitle: "Manage your learning" },
  };

  const header = headers[pageName] || { title: "LinguaLearn", subtitle: "" };
  document.getElementById("pageTitle").textContent = header.title;
  document.getElementById("pageSubtitle").textContent = header.subtitle;
}

// Initialize App
function initializeApp() {
  const data = db.getData();
  switchPage("dashboard");
  updateUI();
  setupEventListeners();
  loadAPIKey();
}

function setupEventListeners() {
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pageName = btn.getAttribute("data-page");
      switchPage(pageName);
    });
  });

  // Language selector
  document.getElementById("languageSelect").addEventListener("change", (e) => {
    showToast(
      `Language changed to ${e.target.options[e.target.selectedIndex].text}`
    );
  });
}

// UI Updates
function updateUI() {
  const data = db.getData();

  // Streak
  document.getElementById(
    "streakDisplay"
  ).textContent = `${data.user.streak} days`;

  // Points
  document.getElementById("points").textContent = data.user.xp;

  // Dashboard stats
  document.getElementById("totalXp").textContent = data.user.xp;
  document.getElementById("lessonsToday").textContent =
    data.dailyProgress.filter(
      (p) => p.date === new Date().toDateString()
    ).length;
  document.getElementById("currentLevel").textContent = data.user.level;
  document.getElementById("gems").textContent = data.user.gems;

  // Progress bar
  const lessonsThisWeek = data.dailyProgress.filter((p) => {
    const date = new Date(p.date);
    const now = new Date();
    const diff = (now - date) / (1000 * 60 * 60 * 24);
    return diff < 7;
  }).length;

  document.getElementById("weeklyProgress").style.width =
    (lessonsThisWeek / 7) * 100 + "%";
  document.getElementById(
    "progressText"
  ).textContent = `${lessonsThisWeek}/7 lessons completed this week`;

  // Profile
  document.getElementById("profileName").textContent = data.user.name;
  document.getElementById(
    "profileLevel"
  ).textContent = `Level ${data.user.level}`;
  document.getElementById("profileXp").textContent = data.user.xp;
  document.getElementById(
    "profileStreak"
  ).textContent = `${data.user.streak} days`;
  document.getElementById("profileDaysLearning").textContent =
    data.user.daysLearning;
  document.getElementById("profileLessons").textContent =
    data.user.lessonsCompleted;
  document.getElementById("nameInput").value = data.user.name;
  document.getElementById("learningGoal").value = data.user.learningGoal;
  document.getElementById("difficulty").value = data.user.difficulty;
}

function updateDashboard() {
  updateUI();
}

// Toast Notification
function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// Conversation Features
let currentConversationTopic = "";

function startConversation() {
  const topic =
    conversationTopics[Math.floor(Math.random() * conversationTopics.length)];
  currentConversationTopic = topic;

  const chatArea = document.getElementById("chatArea");
  chatArea.innerHTML = "";

  const botMessage = document.createElement("div");
  botMessage.className = "message bot-message";
  botMessage.innerHTML = `
        <div class="message-content">
            <strong>Topic:</strong> ${topic}
            <div class="message-options">
                <button class="option-btn" onclick="sendSampleResponse('Hi there!')">Hi there!</button>
                <button class="option-btn" onclick="sendSampleResponse('Let\\'s talk')">Let's talk</button>
                <button class="option-btn" onclick="sendSampleResponse('I\\'m ready')">I'm ready</button>
            </div>
        </div>
    `;
  chatArea.appendChild(botMessage);

  showToast("Conversation started! Begin chatting...");
}

function loadRandomTopic() {
  startConversation();
}

async function sendConversationResponse() {
  const input = document.getElementById("conversationInput");
  const message = input.value.trim();

  if (!message) return;

  // Add user message
  addMessageToChat(message, "user");
  input.value = "";

  // Show loading indicator
  const sendBtn = document.getElementById("sendBtn");
  const originalText = sendBtn.textContent;
  sendBtn.textContent = "Thinking...";
  sendBtn.disabled = true;

  try {
    // Call OpenRouter API
    const selectedLanguage = document.getElementById("languageSelect").value;
    const languageMap = {
      spanish: "Spanish",
      french: "French",
      german: "German",
      italian: "Italian",
      japanese: "Japanese",
    };

    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a friendly ${languageMap[selectedLanguage]} language tutor. Keep responses short, encouraging, and helpful for language learning. Provide brief feedback on grammar and vocabulary used.`,
          },
          {
            role: "user",
            content: `Topic: ${currentConversationTopic}\n\nStudent says: "${message}"\n\nRespond naturally and provide brief constructive feedback.`,
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;

    addMessageToChat(botResponse, "bot");

    // Show feedback
    setTimeout(() => {
      showFeedback(message, botResponse);
    }, 500);
  } catch (error) {
    console.log("[v0] API Error:", error);
    addMessageToChat("Sorry, I encountered an error. Please try again!", "bot");
  } finally {
    sendBtn.textContent = originalText;
    sendBtn.disabled = false;
  }

  db.addLesson();
  db.addPoints(10);
  updateUI();
}

function sendSampleResponse(text) {
  document.getElementById("conversationInput").value = text;
  sendConversationResponse();
}

function addMessageToChat(text, sender) {
  const chatArea = document.getElementById("chatArea");
  const message = document.createElement("div");
  message.className = `message ${sender}-message`;
  message.innerHTML = `<div class="message-content">${text}</div>`;
  chatArea.appendChild(message);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function showFeedback(userMessage, tutorResponse) {
  const feedbackDiv = document.getElementById("responseFeedback");
  const feedbackText = document.getElementById("feedbackText");

  const feedback = `Tutor says: "${tutorResponse}"`;
  feedbackText.textContent = feedback;
  feedbackDiv.style.display = "block";
}

function closeFeeback() {
  document.getElementById("responseFeedback").style.display = "none";
}

// Vocabulary Quiz
function startVocabQuiz() {
  vocabState = {
    currentQuestion: 0,
    score: 0,
    isAnswered: false,
    isActive: true,
    selectedAnswer: null,
    questions: [...vocabularyQuestions].sort(() => Math.random() - 0.5),
  };

  document.getElementById("vocabStartBtn").style.display = "none";
  document.getElementById("vocabNextBtn").style.display = "block";
  document.getElementById("vocabResult").style.display = "none";

  displayVocabQuestion();
}

function displayVocabQuestion() {
  if (vocabState.currentQuestion >= vocabState.questions.length) {
    endVocabQuiz();
    return;
  }

  const question = vocabState.questions[vocabState.currentQuestion];
  document.getElementById(
    "vocabQuestion"
  ).textContent = `What does "${question.word}" mean?`;

  const optionsDiv = document.getElementById("vocabOptions");
  optionsDiv.innerHTML = "";

  question.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "answer-option";
    btn.textContent = option;
    btn.onclick = () => selectVocabAnswer(index, question.correct);
    optionsDiv.appendChild(btn);
  });

  document.getElementById("vocabProgress").textContent = `${vocabState.currentQuestion + 1
    }/5`;
  document.getElementById("vocabProgressBar").style.width =
    ((vocabState.currentQuestion + 1) / 5) * 100 + "%";
}

function selectVocabAnswer(selectedIndex, correctIndex) {
  if (vocabState.isAnswered) return;

  vocabState.isAnswered = true;
  vocabState.selectedAnswer = selectedIndex;

  const options = document.querySelectorAll("#vocabOptions .answer-option");
  options[correctIndex].classList.add("correct");

  if (selectedIndex === correctIndex) {
    options[selectedIndex].classList.add("correct");
    vocabState.score++;
    db.addPoints(15);
  } else {
    options[selectedIndex].classList.add("incorrect");
  }

  document.getElementById("vocabNextBtn").style.display = "block";
}

function nextVocabQuestion() {
  vocabState.currentQuestion++;
  vocabState.isAnswered = false;
  vocabState.selectedAnswer = null;
  displayVocabQuestion();
}

function endVocabQuiz() {
  document.getElementById("vocabQuizContent").style.display = "none";
  document.getElementById("vocabNextBtn").style.display = "none";
  document.getElementById("vocabResult").style.display = "block";

  const percentage = (vocabState.score / vocabState.questions.length) * 100;
  document.getElementById("vocabScore").textContent = `You scored ${vocabState.score
    }/5 (${Math.round(percentage)}%)`;

  db.addLesson();
  db.addPoints(50);
  updateUI();
}

function resetVocabQuiz() {
  document.getElementById("vocabQuizContent").style.display = "block";
  document.getElementById("vocabStartBtn").style.display = "block";
  document.getElementById("vocabResult").style.display = "none";
  vocabState = {
    currentQuestion: 0,
    score: 0,
    isAnswered: false,
    isActive: false,
    selectedAnswer: null,
    questions: [],
  };
  startVocabQuiz();
}

// Grammar Quiz
function startGrammarQuiz() {
  grammarState = {
    currentQuestion: 0,
    score: 0,
    isAnswered: false,
    isActive: true,
    selectedAnswer: null,
    questions: [...grammarQuestions].sort(() => Math.random() - 0.5),
  };

  document.getElementById("grammarStartBtn").style.display = "none";
  document.getElementById("grammarNextBtn").style.display = "block";
  document.getElementById("grammarResult").style.display = "none";

  displayGrammarQuestion();
}

function displayGrammarQuestion() {
  if (grammarState.currentQuestion >= grammarState.questions.length) {
    endGrammarQuiz();
    return;
  }

  const question = grammarState.questions[grammarState.currentQuestion];
  document.getElementById("grammarQuestion").textContent = question.question;

  const optionsDiv = document.getElementById("grammarOptions");
  optionsDiv.innerHTML = "";

  question.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "answer-option";
    btn.textContent = option;
    btn.onclick = () => selectGrammarAnswer(index, question.correct);
    optionsDiv.appendChild(btn);
  });

  document.getElementById("grammarProgress").textContent = `${grammarState.currentQuestion + 1
    }/5`;
  document.getElementById("grammarProgressBar").style.width =
    ((grammarState.currentQuestion + 1) / 5) * 100 + "%";
}

function selectGrammarAnswer(selectedIndex, correctIndex) {
  if (grammarState.isAnswered) return;

  grammarState.isAnswered = true;
  grammarState.selectedAnswer = selectedIndex;

  const options = document.querySelectorAll("#grammarOptions .answer-option");
  options[correctIndex].classList.add("correct");

  if (selectedIndex === correctIndex) {
    options[selectedIndex].classList.add("correct");
    grammarState.score++;
    db.addPoints(15);
  } else {
    options[selectedIndex].classList.add("incorrect");
  }

  document.getElementById("grammarNextBtn").style.display = "block";
}

function nextGrammarQuestion() {
  grammarState.currentQuestion++;
  grammarState.isAnswered = false;
  grammarState.selectedAnswer = null;
  displayGrammarQuestion();
}

function endGrammarQuiz() {
  document.getElementById("grammarQuizContent").style.display = "none";
  document.getElementById("grammarNextBtn").style.display = "none";
  document.getElementById("grammarResult").style.display = "block";

  const percentage = (grammarState.score / grammarState.questions.length) * 100;
  document.getElementById("grammarScore").textContent = `You scored ${grammarState.score
    }/5 (${Math.round(percentage)}%)`;

  db.addLesson();
  db.addPoints(50);
  updateUI();
}

function resetGrammarQuiz() {
  document.getElementById("grammarQuizContent").style.display = "block";
  document.getElementById("grammarStartBtn").style.display = "block";
  document.getElementById("grammarResult").style.display = "none";
  grammarState = {
    currentQuestion: 0,
    score: 0,
    isAnswered: false,
    isActive: false,
    selectedAnswer: null,
    questions: [],
  };
  startGrammarQuiz();
}

// Speaking Practice
function startSpeaking() {
  if (speakingState.currentPhrase >= speakingPhrases.length) {
    speakingState.currentPhrase = 0;
  }

  const phrase = speakingPhrases[speakingState.currentPhrase];
  document.getElementById("promptText").textContent = phrase.phrase;
  document.getElementById(
    "promptTranslation"
  ).textContent = `(${phrase.translation})`;

  document.getElementById("startSpeakBtn").style.display = "none";
  document.getElementById("stopSpeakBtn").style.display = "flex";
  document.getElementById("speakingFeedback").style.display = "none";
  document.getElementById("speakingAnalysis").style.display = "none";

  speakingState.isRecording = true;
  speakingState.isActive = true;

  // Simulate recording
  setTimeout(() => {
    if (speakingState.isRecording) {
      completeRecording();
    }
  }, 3000);

  showToast("Recording started... Speak now!");
}

function stopSpeaking() {
  speakingState.isRecording = false;
  completeRecording();
}

function completeRecording() {
  document.getElementById("stopSpeakBtn").style.display = "none";
  document.getElementById("startSpeakBtn").style.display = "flex";
  document.getElementById("speakingFeedback").style.display = "block";

  const phrase = speakingPhrases[speakingState.currentPhrase];
  document.getElementById("recordingText").textContent = phrase.phrase;
}

function playRecording() {
  showToast("Playing recording...");
}

function submitSpeaking() {
  // Simulate analysis
  document.getElementById("speakingFeedback").style.display = "none";
  document.getElementById("speakingAnalysis").style.display = "block";

  document.getElementById("pronunciationScore").textContent = "92%";
  document.getElementById("fluencyScore").textContent = "88%";
  document.getElementById("accuracyScore").textContent = "95%";

  db.addPoints(20);
  speakingState.score++;
  updateUI();
}

function nextSpeakingPhrase() {
  speakingState.currentPhrase++;
  if (speakingState.currentPhrase >= speakingPhrases.length) {
    showToast("Great! You've completed all phrases!");
    speakingState.currentPhrase = 0;
  }

  document.getElementById("speakingFeedback").style.display = "none";
  document.getElementById("speakingAnalysis").style.display = "none";
  document.getElementById("startSpeakBtn").style.display = "flex";

  const phrase = speakingPhrases[speakingState.currentPhrase];
  document.getElementById("promptText").textContent = phrase.phrase;
  document.getElementById(
    "promptTranslation"
  ).textContent = `(${phrase.translation})`;
}

// Daily Goal Progress with Color Animation
const dailyGoalProgressBar = document.getElementById("dailyGoalProgress");
const dailyGoalText = document.getElementById("dailyGoalText");
const dailyGoalTarget = 50; // 50 XP per day

function getProgressColor(percent) {
  if (percent < 50) return "red";
  if (percent < 80) return "orange";
  return "green";
}

function updateDailyGoalProgress() {
  const data = db.getData();
  const today = new Date().toDateString();
  const todayProgress = data.dailyProgress.filter(p => p.date === today).length;
  const progressPercent = Math.min((todayProgress / dailyGoalTarget) * 100, 100);

  dailyGoalProgressBar.style.width = progressPercent + "%";
  dailyGoalProgressBar.style.backgroundColor = getProgressColor(progressPercent);
  dailyGoalText.textContent = `${todayProgress}/${dailyGoalTarget} XP today`;
}

// Override DB methods to auto-update progress bar
const originalAddPoints = db.addPoints.bind(db);
db.addPoints = function (points) {
  originalAddPoints(points);
  updateDailyGoalProgress();
};

const originalAddLesson = db.addLesson.bind(db);
db.addLesson = function () {
  originalAddLesson();
  updateDailyGoalProgress();
};

// Initialize progress bar on page load
document.addEventListener("DOMContentLoaded", () => {
  updateDailyGoalProgress();
});

// Profile Management
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();

  // Save profile changes
  document.getElementById("nameInput").addEventListener("change", (e) => {
    db.updateUser({ name: e.target.value });
    updateUI();
    showToast("Profile updated!");
  });

  document.getElementById("learningGoal").addEventListener("change", (e) => {
    db.updateUser({ learningGoal: e.target.value });
    showToast("Learning goal updated!");
  });

  document.getElementById("difficulty").addEventListener("change", (e) => {
    db.updateUser({ difficulty: e.target.value });
    showToast("Difficulty level updated!");
  });
});

// Data Management
function exportData() {
  const data = db.getData();
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lingualearn-backup.json";
  link.click();
  showToast("Data exported successfully!");
}

function resetAllData() {
  if (confirm("Are you sure? This will delete all your progress!")) {
    localStorage.removeItem("lingualearn");
    db.initializeDB();
    updateUI();
    switchPage("dashboard");
    showToast("All data has been reset!");
  }
}



//API Key
//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